// @flow
const { followDown, goBack } = require("../src/followDown");
import type { VelvetChain } from "../src/VelvetChain";
import type { BlockId, Level } from "../src/types";
const { toInt, fromInt, revHex } = require("./helpers");
const { BufferSet } = require("buffer-map");
const nullthrows = require("nullthrows");

class MockChain implements VelvetChain {
  levels: Array<number>;
  genesis: ?BlockId;
  blockIdsWithBadInterlink: BufferSet;

  _realIndex(i: number) {
    return (i + this.levels.length) % this.levels.length;
  }

  constructor(
    levels: Array<number>,
    blockIdsWithBadInterlink: Array<BlockId> = []
  ) {
    this.levels = levels;
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
    return (undefined: any);
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

const LEVELS_SMALL = [Infinity, 4, 0, 1, 2, 3, 4];
const LEVELS_BIG = [Infinity, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0];

describe("followDown", () => {
  it("works on small sample", () => {
    const mockChain = new MockChain(LEVELS_SMALL);
    let path = followDown(mockChain, fromInt(6), fromInt(2));
    expect(path.map(toInt)).toEqual([3, 4, 5]);
  });

  it(
    "not hang with invalid arguments",
    () => {
      const mockChain = new MockChain(LEVELS_BIG);
      expect(() => {
        const path = followDown(mockChain, fromInt(1), fromInt(4));
      }).toThrow();
    },
    500
  );
});

describe("goBack", () => {
  it("works", () => {
    const badInterlinks = [3].map(fromInt);
    const mockChain = new MockChain(LEVELS_SMALL, badInterlinks);
    let path = goBack(mockChain, fromInt(3), fromInt(1));
    expect(path.map(toInt)).toEqual([2]);
  });
});
