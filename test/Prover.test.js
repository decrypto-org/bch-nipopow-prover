// @flow

jest.mock("../src/level");
jest.mock("../src/interlinkExtractor");

const { toInt, fromInt, range, overwriteLog, _mock } = require("./helpers");
const Prover = require("../src/Prover");
const {
  extractInterlinkHashesFromMerkleBlock
} = require("../src/interlinkExtractor");
const level = require("../src/level");

debugger;

overwriteLog();

_mock(extractInterlinkHashesFromMerkleBlock).mockImplementation(() => []);

function blockFromId(id): bcash$MerkleBlock {
  const int = toInt(id);
  return ({
    hash: jest.fn(() => id),
    prevBlock: int === 0 ? null : fromInt(int - 1)
  }: any);
}

function proverWithBlocks(blockIdList) {
  const prover = new Prover();
  addBlocksToProver(blockIdList, prover);
  return prover;
}

function addBlocksToProver(blockIds, prover) {
  let height = 0;
  for (let id of blockIds) {
    prover.onBlock(blockFromId(id), ++height);
    console.log("block on height", height);
  }
}

function levelUsingLevels(levels) {
  _mock(level).mockClear();
  _mock(level).mockImplementation(id => levels[toInt(id)]);
}

function mockRealLink(blockIds, blockIdsWithInvalidInterlink, levels) {
  levels = levels || [Infinity, ...Array(blockIds.length - 1).fill(5)];
  return {
    onBlock: () => {},
    hasValidInterlink: id => !blockIdsWithInvalidInterlink.includes(toInt(id)),
    get: id => ({
      at: x => {
        let rightEnd = toInt(id);
        for (let i = rightEnd - 1; i >= 0; --i) {
          // $FlowFixMe
          if (levels[i] >= x) {
            console.log(`returning ${i} for ${rightEnd}`);
            return blockIds[i];
          }
        }
      },
      hash: () => Buffer.from("")
    })
  };
}

describe("Prover", () => {
  beforeEach(() => {
    _mock(level).mockClear();
    _mock(extractInterlinkHashesFromMerkleBlock).mockClear();
  });

  it("can be instantiated", () => {
    const prover = new Prover();
  });

  it("throws when no blocks are given", () => {
    const prover = new Prover();
    expect(() => prover.realLink).toThrow();
  });

  it("saves a given block", () => {
    let foo = Buffer.from("foo");
    const prover = proverWithBlocks([foo]);
    expect(prover.idAt(0)).toEqual(foo);
    expect(prover.genesis).toEqual(foo);
  });

  it("provides python-style indexes", () => {
    let one = Buffer.from("one"),
      two = Buffer.from("two");
    const prover = proverWithBlocks([one, two]);
    expect(prover.idAt(-1)).toEqual(two);
  });

  it("will ignore duplicate blocks", () => {
    let one = Buffer.from("one"),
      two = Buffer.from("two");
    const prover = proverWithBlocks([one, two]);
    prover.onBlock(blockFromId(one), 0);
    expect(prover.idAt(-1)).toEqual(two);
  });

  it("throws when asked about unknown blocks", () => {
    let foo = Buffer.from("foo"),
      bar = Buffer.from("bar");
    const prover = proverWithBlocks([foo]);
    expect(() => prover.interlinkSizeOf(bar)).toThrow();
    expect(() => prover.interlinkFor(bar)).toThrow();
    expect(() => prover.getBlockById(bar)).toThrow();
  });

  it("works when asked about known blocks", () => {
    let foo = Buffer.from("foo");
    const prover = proverWithBlocks([foo]);
    expect(prover.interlinkSizeOf(foo)).toBeDefined();
    expect(prover.interlinkFor(foo)).toBeDefined();
    expect(prover.getBlockById(foo)).toBeDefined();
  });

  describe("followUp", () => {
    it("will return 2 blocks (1 of them the given) on validly interlinked chain", () => {
      const blockIds = range(5).map(fromInt);
      const prover = proverWithBlocks(blockIds);

      jest
        .spyOn(prover, "realLink", "get")
        .mockImplementation(() => mockRealLink(blockIds, []));

      _mock(level).mockClear();
      _mock(level).mockImplementation(id => 5);
      const path = prover.followUp(blockIds[3], 5);
      expect(level).toHaveBeenCalledTimes(1);
      expect(path.map(toInt)).toEqual([2, 3]);
    });

    it("will return a level-0 block if there's a non-validly interlinked block", () => {
      const blockIds = range(5).map(fromInt);
      const prover = proverWithBlocks(blockIds);

      jest
        .spyOn(prover, "realLink", "get")
        .mockImplementation(() => mockRealLink(blockIds, [2]));

      _mock(level).mockClear();
      _mock(level).mockImplementation(id => (toInt(id) !== 2 ? 5 : 0));
      const path = prover.followUp(blockIds[3], 5);
      expect(level).toHaveBeenCalledTimes(2);
      expect(path.map(toInt)).toEqual([1, 2, 3]);
    });

    it("will lead up to genesis if needed", () => {
      const blockIds = range(5).map(fromInt);
      const prover = proverWithBlocks(blockIds);

      jest
        .spyOn(prover, "realLink", "get")
        .mockImplementation(() => mockRealLink(blockIds, blockIds.map(toInt)));

      _mock(level).mockClear();
      _mock(level).mockImplementation(id => 0);
      const path = prover.followUp(blockIds[3], 5);
      expect(level).toHaveBeenCalledTimes(3);
      expect(path.map(toInt)).toEqual([0, 1, 2, 3]);
    });
  });

  describe("findVelvetUpchain", () => {
    it("returns all blocks till genesis if all on same level", () => {
      const blockIds = range(5).map(fromInt);
      const prover = new Prover();

      levelUsingLevels([Infinity, 5, 5, 5, 5]);
      jest
        .spyOn(prover, "realLink", "get")
        .mockImplementation(() => mockRealLink(blockIds, []));
      addBlocksToProver(blockIds, prover);

      const { muSubchain, wholePath } = prover.findVelvetUpchain(
        5,
        blockIds[0],
        blockIds[4]
      );
      expect(muSubchain.map(toInt)).toEqual(range(5));
      expect(wholePath.map(toInt)).toEqual(range(5));
    });

    it("selects blocks of a specific level on all valid interlinks", () => {
      const blockIds = range(5).map(fromInt);
      const prover = new Prover();
      const levels = [Infinity, 5, 0, 0, 5];
      levelUsingLevels(levels);
      jest
        .spyOn(prover, "realLink", "get")
        .mockImplementation(() => mockRealLink(blockIds, [], levels));
      addBlocksToProver(blockIds, prover);

      const { muSubchain, wholePath } = prover.findVelvetUpchain(
        5,
        blockIds[0],
        blockIds[4]
      );
      expect(muSubchain.map(toInt)).toEqual([0, 1, 4]);
      expect(wholePath.map(toInt)).toEqual([0, 1, 4]);
    });

    it("works when invalid interlinks exist", () => {
      const blockIds = range(5).map(fromInt);
      const prover = new Prover();
      const levels = [Infinity, 5, 0, 0, 5];
      levelUsingLevels(levels);
      jest
        .spyOn(prover, "realLink", "get")
        .mockImplementation(() => mockRealLink(blockIds, [4], levels));
      addBlocksToProver(blockIds, prover);

      const { muSubchain, wholePath } = prover.findVelvetUpchain(
        5,
        blockIds[0],
        blockIds[4]
      );
      expect(muSubchain.map(toInt)).toEqual([0, 1, 4]);
      expect(wholePath.map(toInt)).toEqual([0, 1, 3, 4]);
    });

    it("works when given as left a non-genesis block", () => {
      const blockIds = range(5).map(fromInt);
      const prover = new Prover();
      const levels = [Infinity, 5, 0, 0, 5];
      levelUsingLevels(levels);
      jest
        .spyOn(prover, "realLink", "get")
        .mockImplementation(() => mockRealLink(blockIds, [4], levels));
      addBlocksToProver(blockIds, prover);

      const { muSubchain, wholePath } = prover.findVelvetUpchain(
        5,
        blockIds[2],
        blockIds[4]
      );
      expect(muSubchain.map(toInt)).toEqual([4]);
      expect(wholePath.map(toInt)).toEqual([3, 4]);
    });
  });
});
