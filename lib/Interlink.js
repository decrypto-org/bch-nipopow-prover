'use strict';

const { util } = require('bcash');
const { shift, compare } = require('math-buffer');
const merkle = require('bcrypto/lib/merkle');
const hash256 = require('bcrypto/lib/hash256');

const MAX_TARGET =
  util.fromRev('ffff0000000000000000000000000000000000000000000000000000');

function level(blockId, target) {
  let tar = Buffer.from(target);
  let shifts = 0;
  while (compare(blockId, tar) <= 0) {
    shift(tar, -1, tar);
    ++shifts;
  }
  return shifts - 1;
}

class Interlink {
  constructor() {
    this.list = [];
  }

  update(blockId) {
    const lvl = level(blockId, MAX_TARGET);
    for (let i = 0; i <= lvl; ++i) {
      if (i < this.list.length)
        this.list[i] = blockId;
      else
        this.list.push(blockId);
    }
  }

  hash() {
    return merkle.createRoot(hash256, [...this.list])[0];
  }
}

module.exports = Interlink;
