const {BufferMap} = require('buffer-map');

const Interlink = require('./Interlink');
const {extractInterlinkHashesFromMerkleBlock} = require('./interlink-extractor');

const h = x => x.toString('hex');

module.exports = class Prover {
  constructor() {
    this.blocks = new BufferMap();
    this.genesis = null;
    this.lastBlock = null;
    this.realLink = new BufferMap();
    this.interlink = new Interlink();
    this.onBlock = this.onBlock.bind(this);
  }

  onBlock(blk) {
    const id = blk.hash();
    if (this.blocks.has(id)) {
      return;
    }

    if (!this.genesis) {
      this.genesis = id;
      console.log('genesis was %O', blk);
    }

    this.blocks.set(id, blk);
    this.lastBlock = id;

    this.realLink.set(this.lastBlock, this.interlink);

    const includedInterlinkHashes = extractInterlinkHashesFromMerkleBlock(blk);
    const valid = includedInterlinkHashes.some(x => x.equals(this.interlink.hash()));
    if (valid) {
      console.log('realLink for %s: %s vs %O', h(id), h(this.interlink.hash()), includedInterlinkHashes.map(h));
    }

    this.interlink = this.interlink.update(id);
  }
};
