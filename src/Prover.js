// @ts-check
const {BufferMap} = require('buffer-map');
const {fromRev} = require('bcash/lib/utils/util');

const Interlink = require('./Interlink');
const defaultLevelFn = require('./level');
const {extractInterlinkHashesFromMerkleBlock} = require('./interlink-extractor');

const h = x => x.toString('hex');

const Gen = fromRev('00000000000001934669a81ecfaa64735597751ac5ca78c4d8f345f11c2237cf');

module.exports = class Prover {
  constructor(levelFn=defaultLevelFn) {
    this.blockById = new BufferMap();
    this.genesis = null;
    this.lastBlock = null;
    this.realLink = new BufferMap();
    this.valid = new BufferMap();
    this.interlink = new Interlink();
    this.blockList = [];
    this.onBlock = this.onBlock.bind(this);
    this.levelFn = levelFn;
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
    // @ts-ignore
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
    let {id} = B;
    while (!id.equals(Gen)) {
      const interlink = this.realLink.get(id);
      if (this.valid.get(id))
        id = interlink.at(mu);
      else
        id = B.prevBlock;

      B = this.blockById.get(id);
      aux.push(B);

      if (this.levelFn(B.id) === mu)
        return {B, aux};
    }
    return {B, aux};
  }

  findUpchain(mu, startBlockId, endBlockId=this.lastBlock) {
    let B = this.blockById.get(endBlockId);
    let aux = [B];
    const pi = [B];
    while (B.id !== startBlockId) { 
      let {B: BPrime, aux: auxPrime} = this.followUp(B, mu);
      B = BPrime;
      aux = aux.concat(auxPrime); // TODO: type error in paper?
      pi.push(B);
    }
    return {pi, aux};
  }

  slice(...args) {
    return this.blockList.slice(...args);
  }

  at(i) {
    if (i < 0) return this.blockList[this.blockList.length + i];
    return this.blockList[i];
  }
};