// @flow
const { suffixProof, infixProof } = require("../src/nipopow");
const Prover = require("../src/Prover");

import type { VelvetChain } from "../src/VelvetChain";
import type { BlockId, Level } from "../src/types";

const { toInt, fromInt, revHex } = require("./helpers");
const { add } = require("math-buffer");
const { BufferSet } = require("buffer-map");
const nullthrows = require("nullthrows");

class MockChain implements VelvetChain {
  levels: Array<number>;
  genesis: ?BlockId;
  blockIdsWithBadInterlink: BufferSet;

  _realIndex(i: number) {
    return (i + this.levels.length) % this.levels.length;
  }

  constructor(blockIdsWithBadInterlink = []) {
    this.levels = [Infinity, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0];
    this.genesis = fromInt(0);
    this.blockIdsWithBadInterlink = new BufferSet(blockIdsWithBadInterlink);
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

    let ans = fullPi
      .filter(x => x >= left && x <= right)
      .map(x => this.idAt(x));
    return {
      muSubchain: ans,
      wholePath: ans
    };
  }

  levelledPrev(id: BlockId, mu: Level): BlockId {
    let int = toInt(id);
    if (this.blockIdsWithBadInterlink.has(id)) {
      return fromInt(int - 1);
    } else {
      for (let i = int - 1; i >= 0; --i) {
        if (this.levels[i] >= mu) {
          return fromInt(i);
        }
      }
      return nullthrows(this.genesis);
    }
  }

  heightOf(id: BlockId) {
    return toInt(id) + 1;
  }
}

test("makes a suffix proof", () => {
  const mockChain = new MockChain();
  let proof = suffixProof({ chain: mockChain, m: 1, k: 1 });
  expect(proof.map(toInt)).toEqual([0, 7, 11, 13, 14]);
});

test("makes an infix proof", () => {
  const mockChain = new MockChain();
  let proof = infixProof({
    chain: mockChain,
    blockOfInterest: fromInt(4),
    m: 1,
    k: 1
  }).map(toInt);
  expect(proof).toContain(4);
  expect(proof).toEqual([0, 4, 5, 7, 11, 13, 14]);
});
