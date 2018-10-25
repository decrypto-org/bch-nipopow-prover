// @flow
const followDown = require("../src/followDown");
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

  constructor(blockIdsWithBadInterlink = []) {
    this.levels = [Infinity, 4, 0, 1, 2, 3, 4];
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

describe("followDown", () => {
  it("works", () => {
    const mockChain = new MockChain();
    let path = followDown(mockChain, fromInt(6), fromInt(2));
    expect(path.map(toInt)).toEqual([3, 4, 5]);
  });
});
