'use strict';

const merkle = require('bcrypto/lib/merkle');
const hash256 = require('bcrypto/lib/hash256');
const level = require('./level');

class Interlink {
  constructor(list = []) {
    this.list = list;
  }

  update(blockId) {
    const list = this.list.slice();
    const lvl = level(blockId);
    for (let i = 0; i <= lvl; ++i) {
      if (i < list.length)
        list[i] = blockId;
      else
        list.push(blockId);
    }
    return new Interlink(list);
  }

  proof(level) {
    return merkle.createBranch(hash256, level, [...this.list]);
  }

  hash() {
    return merkle.createRoot(hash256, [...this.list])[0];
  }
}

module.exports = Interlink;
