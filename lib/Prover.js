const {BufferMap} = require('buffer-map');
const {fromRev} = require('bcash/lib/utils/util');

const Interlink = require('./Interlink');
const {extractInterlinkHashesFromMerkleBlock} = require('./interlink-extractor');

const h = x => x.toString('hex');

const Gen = fromRev('00000000000001934669a81ecfaa64735597751ac5ca78c4d8f345f11c2237cf');

module.exports = class Prover {
  constructor() {
    this.blockById = new BufferMap();
    this.genesis = null;
    this.lastBlock = null;
    this.realLink = new BufferMap();
    this.valid = new BufferMap();
    this.interlink = new Interlink();
    this.blockList = [];
    this.onBlock = this.onBlock.bind(this);
  }

  onBlock(blk) {
    const id = blk.hash();
    if (this.blockById.has(id)) {
      return;
    }

    if (!this.genesis) {
      this.genesis = id;
      console.log('genesis was %O', blk);
    }

    this.blockById.set(id, blk);
    this.blockList.push(blk);

    if (this.lastBlock)
      this.realLink.set(this.lastBlock, this.interlink);

    const includedInterlinkHashes = extractInterlinkHashesFromMerkleBlock(blk);
    const valid = includedInterlinkHashes.some(x => x.equals(this.interlink.hash()));
    if (this.lastBlock)
      this.valid.set(this.lastBlock, valid);
    if (valid) {
      console.log('realLink for %s: %s vs %O', h(id), h(this.interlink.hash()),
        includedInterlinkHashes.map(h));
    }

    this.lastBlock = id;
    this.interlink = this.interlink.update(id);
  }

  followUp(B, mu) {
    let aux = [B];
    let id = B.hash();
    while (!id.equals(Gen)) {
      const interlink = this.realLink.get(id);
      if (this.valid.get(id))
        id = interlink[mu];
      else
        id = interlink[0];

      B = this.blockById.get(id);
      aux.push(B);
    }
  }
};
