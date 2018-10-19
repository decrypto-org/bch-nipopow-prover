// @flow

const fs = require("fs");
const pEvent = require("p-event");
const MerkleBlockSerializer = require("./MerkleBlockSerializer");

module.exports = class BlockSaver {
  saveStream: fs.WriteStream;
  entriesWritten: number;

  constructor() {
    this.saveStream = fs.createWriteStream("merkleblocks.json");
    this.entriesWritten = 0;
    this.saveStream.write("[");
  }

  onBlock(blk: bcash$MerkleBlock) {
    let prefix = this.entriesWritten > 0 ? "," : "";
    this.saveStream.write(
      prefix + JSON.stringify(MerkleBlockSerializer.serialize(blk))
    );
    ++this.entriesWritten;
  }

  async save() {
    this.saveStream.write("]");
    this.saveStream.end();
    await pEvent(this.saveStream, "finish");
  }
};
