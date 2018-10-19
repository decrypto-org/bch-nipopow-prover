// @flow

const { BufferMap, BufferSet } = require("buffer-map");
const Interlink = require("./Interlink");

import type { BlockId } from "./types";

module.exports = class RealLink {
  blockIdToInterlink: BufferMap;
  runningInterlink: Interlink;
  validBlocks: BufferSet;

  constructor() {
    this.blockIdToInterlink = new BufferMap();
    this.runningInterlink = new Interlink();
    this.validBlocks = new BufferSet();
  }

  onBlock(newBlockId: BlockId, interlinks: Array<Buffer>) {
    if (this.blockIdToInterlink.has(newBlockId)) {
      return;
    }

    this.blockIdToInterlink.set(newBlockId, this.runningInterlink);
    if (
      interlinks.some(interlink =>
        interlink.equals(this.runningInterlink.hash())
      )
    ) {
      this.validBlocks.add(newBlockId);
    }
    this.runningInterlink = this.runningInterlink.update(newBlockId);
  }

  get(blockId: BlockId) {
    return this.blockIdToInterlink.get(blockId);
  }

  hasValidInterlink(blockId: BlockId) {
    return this.validBlocks.has(blockId);
  }
};
