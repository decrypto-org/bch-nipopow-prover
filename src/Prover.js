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

import type { VelvetChain } from "./VelvetChain";

const { TESTNET_GENESIS_HEIGHT } = require("./constants");

const RealLink = require("./RealLink");

module.exports = class Prover implements VelvetChain {
  genesis: ?BlockId;
  lastBlock: ?BlockId;
  _realLink: ?RealLink;
  blockById: BufferMap;
  blockList: Array<BlockId>;
  onBlock: (blk: bcash.MerkleBlock, height: number) => void;

  constructor() {
    this.blockById = new BufferMap();
    this.genesis = null;
    this.lastBlock = null;
    this.blockList = [];

    this.onBlock = this.onBlock.bind(this);
  }

  get realLink() {
    if (!this._realLink) {
      throw new Error("realLink requested on empty chain");
    }
    return this._realLink;
  }

  onBlock(blk: bcash.MerkleBlock, height: number) {
    if (height < TESTNET_GENESIS_HEIGHT) {
      console.log("ignoring block at height = %d", height);
      return;
    }
    const id = blk.hash();
    if (this.blockById.has(id)) {
      return;
    }

    if (!this.genesis) {
      this.genesis = id;
      this._realLink = new RealLink(this.genesis);
      console.log("genesis was %O", blk);
    }

    this.blockById.set(id, blk);
    this.blockList.push(blk.hash());

    const includedInterlinkHashes = extractInterlinkHashesFromMerkleBlock(blk);
    this.realLink.onBlock(id, includedInterlinkHashes);
    if (this.realLink.hasValidInterlink(id)) {
      console.log(
        "realLink for %s: %s vs %O",
        h(id),
        h(this.realLink.get(id).hash()),
        includedInterlinkHashes.map(h)
      );
    }

    this.lastBlock = id;
  }

  followUp(newerBlockId: BlockId, mu: Level): Array<BlockId> {
    let id = newerBlockId;
    let path = [id];
    let B = this.blockById.get(id);
    while (!id.equals(Gen)) {
      const interlink = this.realLink.get(id);
      if (this.realLink.hasValidInterlink(id)) id = interlink.at(mu);
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
