// We want txs to be included in our serialization/deserialization for testing purposes.
// This hacky way is the easiest way to do it right.

const { MerkleBlock, Block, TX } = require("bcash");
module.exports = {
  serialize: merkleBlock => {
    return Block.prototype.getJSON.call(merkleBlock);
  },
  deserialize: json => {
    const merkleBlock = new MerkleBlock();
    Block.prototype.fromJSON.call(merkleBlock, json);
    return merkleBlock;
  }
};
