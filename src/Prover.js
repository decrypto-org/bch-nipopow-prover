// @flow

const assert = require("assert");
const bcash = require("bcash");
const { BufferMap } = require("buffer-map");
const { fromRev } = require("bcash/lib/utils/util");

const Interlink = require("./Interlink");
const level = require("./level");
const {
  extractInterlinkHashesFromMerkleBlock
} = require("./interlinkExtractor");

const h = x => x.toString("hex");

const Gen = fromRev(
  "00000000000001934669a81ecfaa64735597751ac5ca78c4d8f345f11c2237cf"
);

import type { BlockId, Level } from "./types";

import type {VelvetChain} from './VelvetChain';

module.exports = class Prover implements VelvetChain {
  genesis: ?BlockId;
  lastBlock: ?BlockId;
  realLink: BufferMap;
  valid: BufferMap;
  blockById: BufferMap;
  interlink: Interlink;
  blockList: Array<BlockId>;
  onBlock: (blk: bcash.MerkleBlock) => void;

  constructor() {
    this.blockById = new BufferMap();
    this.genesis = null;
    this.lastBlock = null;
    this.realLink = new BufferMap();
    this.valid = new BufferMap();
    this.interlink = new Interlink();
    this.blockList = [];

    this.onBlock = this.onBlock.bind(this);
  }

  onBlock(blk: bcash.MerkleBlock) {
    const id = blk.hash();
    if (this.blockById.has(id)) {
      return;
    }

    if (!this.genesis) {
      this.genesis = id;
      console.log("genesis was %O", blk);
    }

    this.blockById.set(id, blk);
    this.blockList.push(blk.hash());

    if (this.lastBlock) this.realLink.set(this.lastBlock, this.interlink);

    const includedInterlinkHashes = extractInterlinkHashesFromMerkleBlock(blk);
    const valid = includedInterlinkHashes.some(x =>
      x.equals(this.interlink.hash())
    );
    if (this.lastBlock) this.valid.set(this.lastBlock, valid);
    if (valid) {
      console.log(
        "realLink for %s: %s vs %O",
        h(id),
        h(this.interlink.hash()),
        includedInterlinkHashes.map(h)
      );
    }

    this.lastBlock = id;
    this.interlink = this.interlink.update(id);
  }

  followUp(newerBlockId: BlockId, mu: Level): Array<BlockId> {
    let id = newerBlockId;
    let path = [id];
    let B = this.blockById.get(id);
    while (!id.equals(Gen)) {
      const interlink = this.realLink.get(id);
      if (this.valid.get(id)) id = interlink.at(mu);
      else id = B.prevBlock;

      B = this.blockById.get(id);
      path.push(id);

      if (level(id) === mu) {
        break;
      }
    }

    path.reverse();
    return path;
  }

  findVelvetUpchain(
    mu: Level,
    leftBlockId: BlockId,
    rightBlockId: ?BlockId = this.lastBlock
  ): {
    muSubchain: Array<BlockId>,
    wholePath: Array<BlockId>
  } {
    let id = rightBlockId;
    if (!id) {
      throw new Error("findVelvetUpchain called but no chain yet");
    }

    let B = this.blockById.get(id);
    let wholePath = [id];
    let muSubchain = [];
    if (level(id) >= mu) {
      muSubchain.push(id);
    }

    while (!id.equals(leftBlockId) || !id.equals(Gen)) {
      let path = this.followUp(id, mu);

      id = path[0];
      B = this.blockById.get(id);

      if (level(id) >= mu) {
        muSubchain.push(id);
      }
      wholePath = path.concat(wholePath);
    }

    muSubchain.reverse();
    return {
      muSubchain,
      wholePath
    };
  }

  idAt(index: number) {
    if (index < 0) {
      index += this.blockList.length;
    }
    return this.blockList[index];
  }

  interlinkSizeOf(id: BlockId) {
    return this.realLink.get(id).length;
  }
};
