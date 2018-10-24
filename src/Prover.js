// @flow

const nullthrows = require("nullthrows");
const bcash = require("bcash");
const { BufferMap } = require("buffer-map");
const { fromRev, revHex } = require("bcash/lib/utils/util");

const Interlink = require("./Interlink");
const level = require("./level");
const {
  extractInterlinkHashesFromMerkleBlock
} = require("./interlinkExtractor");

const h = x => x.toString("hex");

import type { BlockId, Level } from "./types";

import type { VelvetChain } from "./VelvetChain";

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
      const interlink = this.interlinkFor(id);
      console.log(
        "realLink for %s: %s vs %O",
        h(id),
        h(interlink.hash()),
        includedInterlinkHashes.map(h)
      );
    }

    this.lastBlock = id;
  }

  followUp(newerBlockId: BlockId, mu: Level): Array<BlockId> {
    const genesis = nullthrows(this.genesis);
    let id = newerBlockId;
    let path = [id];
    let B = this.getBlockById(id);
    while (!id.equals(genesis)) {
      const interlink = this.interlinkFor(id);
      if (this.realLink.hasValidInterlink(id)) id = interlink.at(mu);
      else id = B.prevBlock;

      B = this.getBlockById(id);
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
    const genesis = nullthrows(this.genesis);
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

    while (!id.equals(leftBlockId) && !id.equals(genesis)) {
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
    return this.interlinkFor(id).length;
  }

  interlinkFor(id: BlockId): Interlink {
    const interlink = this.realLink.get(id);
    if (!interlink) {
      throw new Error(`no interlink for block ${revHex(id)}`);
    }
    return interlink;
  }

  getBlockById(id: BlockId): bcash.MerkleBlock {
    const block = this.blockById.get(id);
    if (!block) {
      throw new Error(`no block record for ${revHex(id)}`);
    }
    return block;
  }
};
