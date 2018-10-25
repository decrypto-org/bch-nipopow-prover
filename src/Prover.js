// @flow

const assert = require("assert");
const nullthrows = require("nullthrows");
const bcash = require("bcash");
const _ = require("lodash");
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

  prev(id: BlockId) {
    return this.getBlockById(id).prevBlock;
  }

  levelledPrev(id: BlockId, mu: Level) {
    if (this.realLink.hasValidInterlink(id)) {
      const interlink = this.interlinkFor(id);
      return interlink.at(mu);
    } else {
      return this.prev(id);
    }
  }

  followUp(newerBlockId: BlockId, mu: Level): Array<BlockId> {
    const genesis = nullthrows(this.genesis);
    let id = newerBlockId;
    let path = [id];
    while (!id.equals(genesis)) {
      id = this.levelledPrev(id, mu);
      path.push(id);

      if (level(id) === mu) {
        break;
      }
    }

    path.reverse();
    return path;
  }

  isLR(l: BlockId, r: BlockId) {
    const genesis = nullthrows(this.genesis);
    if (l.equals(r)) {
      return false;
    }
    for (
      ;
      r && !r.equals(genesis) && !r.equals(l);
      r = this.getBlockById(r).prevBlock
    ) {}
    return l.equals(genesis) || r.equals(l);
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

    let wholePath = [];
    let muSubchain = [];
    if (level(id) >= mu) {
      muSubchain.push(id);
    }

    let goneTooFar = false;
    while (!id.equals(leftBlockId) && !id.equals(genesis) && !goneTooFar) {
      let path = this.followUp(id, mu);
      console.log("path was " + path.map(revHex).join());

      let outOfRangePathIndex = _.findLastIndex(path, x =>
        this.isLR(x, leftBlockId)
      );
      if (outOfRangePathIndex !== -1) {
        console.log(
          `found out of range path with index ${outOfRangePathIndex} where path = ${path
            .map(revHex)
            .join()}`
        );
        path.splice(0, outOfRangePathIndex + 1);
        goneTooFar = true;
      }

      id = path[0];
      console.log(`got id ${revHex(id)}`);

      if (level(id) >= mu) {
        muSubchain.push(id);
      }
      wholePath = path.slice(1).concat(wholePath);
    }

    wholePath = [id, ...wholePath];

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
    return nullthrows(this.realLink.get(id));
  }

  getBlockById(id: BlockId): bcash.MerkleBlock {
    return nullthrows(this.blockById.get(id));
  }

  areLinkable(blockIds: Array<BlockId>) {
    for (let i = 1; i < blockIds.length; ++i) {
      const blk = blockIds[i],
        wantedPrev = blockIds[i - 1];
      if (this.prev(blk).equals(wantedPrev)) {
      } else if (this.realLink.hasValidInterlink(blk)) {
        const mu = level(wantedPrev);
        assert(
          this.interlinkFor(blk)
            .at(mu)
            .equals(wantedPrev)
        );
      } else {
        // $FlowFixMe
        assert.fail(
          `couldn't link block ${revHex(blk)} to ${revHex(wantedPrev)}`
        );
      }
    }
    return blockIds;
  }
};
