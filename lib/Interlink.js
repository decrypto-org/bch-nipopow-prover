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
  constructor(list = []) {
    this.list = list;
  }

  update(blockId) {
    const list = this.list.slice();
    const lvl = level(blockId, MAX_TARGET);
    for (let i = 0; i <= lvl; ++i) {
      if (i < list.length)
        list[i] = blockId;
      else
        list.push(blockId);
    }
    return new Interlink(list);
  }

  hash() {
    return merkle.createRoot(hash256, [...this.list])[0];
  }
}

module.exports = Interlink;
