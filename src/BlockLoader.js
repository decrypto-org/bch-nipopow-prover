// @flow

const fs = require("fs");
const MerkleBlockSerializer = require("./MerkleBlockSerializer");

module.exports = class BlockLoader {
  blocks: Array<{}>;

  constructor(fileName: string) {
    this.blocks = JSON.parse(fs.readFileSync(fileName, "utf8"));
  }

  *getBlocks(): Iterable<bcash$MerkleBlock> {
    for (let block of this.blocks) {
      yield MerkleBlockSerializer.deserialize(block);
    }
  }
};
