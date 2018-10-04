const {MerkleBlock, TX} = require('bcash');
module.exports = {
  serialize: merkleBlock => {
    const json = merkleBlock.toJSON();
    json.txs = merkleBlock.txs.map(tx => tx.toJSON());
    return json;
  },
  deserialize: json => {
    const merkleBlock = MerkleBlock.fromJSON(json);
    merkleBlock.txs = json.txs.map(tx => TX.fromJSON(tx));
    return merkleBlock;
  }
};
