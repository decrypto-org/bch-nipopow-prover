// @flow
const {suffixProof} = require('../src/nipopow');
const Prover = require('../src/Prover');

import type {VelvetChain} from '../src/VelvetChain';
import type {BlockId} from '../src/types';

const {fromInt, add} = require('math-buffer');
const {util: {revHex}} = require('bcash');

function toInt(buf: Buffer): number {
  return parseInt('0x' + revHex(buf));
}

class MockChain implements VelvetChain {
  levels: Array<number>;
  genesis: ?BlockId;

  _realIndex(i: number) {
    return (i + this.levels.length) % this.levels.length;
  }

  constructor() {
    this.levels = [Infinity, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0];
    this.genesis = fromInt(0);
  }

  idAt(i: number) {
    return fromInt(this._realIndex(i));
  }

  interlinkSizeOf(id) {
    let i = toInt(id);
    let levelsBefore = this.levels.filter((_, idx) => idx > 0 && idx < i);
    return Math.max(...levelsBefore);
  }

  findVelvetUpchain(level, leftId, rightId) {
    let left = toInt(leftId);
    let right = rightId ? toInt(rightId) : this.levels.length - 1;
    const fullPi = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      [0, 1, 3, 5, 7, 9, 11, 13],
      [0, 3, 7, 11],
      [0, 7]
    ][level];

    let ans = fullPi.filter(x => x >= left && x <= right).map(x => this.idAt(x));
    return {
      muSubchain: ans,
      wholePath: ans
    };
  }
}

test('makes a suffix proof', () => {
  const mockChain = new MockChain();
  let proof = suffixProof({chain: mockChain, m: 1, k: 1});
  expect(proof.map(toInt)).toEqual([0, 7, 11, 13, 14]);
});
