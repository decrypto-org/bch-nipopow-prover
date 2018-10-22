// @flow

const merkle = require("bcrypto/lib/merkle");
const hash256 = require("bcrypto/lib/hash256");
const level = require("./level");

import type { BlockId } from "./types";

const { TESTNET_GENESIS_ID } = require("./constants");

class Interlink {
  list: Array<BlockId>;
  genesisId: BlockId;

  constructor(genesisId: BlockId, list: Array<BlockId> = []) {
    this.genesisId = genesisId;
    this.list = list;
  }

  update(blockId: BlockId) {
    const list = this.list.slice();
    const lvl = level(blockId);
    for (let i = 0; i <= lvl; ++i) {
      if (i < list.length) list[i] = blockId;
      else list.push(blockId);
    }
    return new Interlink(this.genesisId, list);
  }

  proof(level: number) {
    return merkle.createBranch(hash256, level, [...this.list]);
  }

  hash() {
    return merkle.createRoot(hash256, [...this.list])[0];
  }

  get length() {
    return this.list.length;
  }

  at(lvl: number) {
    if (lvl >= this.list.length) {
      return this.genesisId;
    }
    return this.list[lvl];
  }
}

module.exports = Interlink;
