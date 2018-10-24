// @flow

jest.mock("../src/level");
jest.mock("../src/interlinkExtractor");

const { toInt, fromInt, range, overwriteLog, _mock } = require("./helpers");
const Prover = require("../src/Prover");
const {
  extractInterlinkHashesFromMerkleBlock
} = require("../src/interlinkExtractor");
const level = require("../src/level");

overwriteLog();

_mock(extractInterlinkHashesFromMerkleBlock).mockImplementation(() => []);

function blockFromId(id): bcash$MerkleBlock {
  return ({
    hash: jest.fn(() => id)
  }: any);
}

function proverWithBlocks(blockIdList) {
  const prover = new Prover();
  let height = 0;
  for (let id of blockIdList) {
    prover.onBlock(blockFromId(id), ++height);
    console.log("block on height", height);
  }
  return prover;
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

      jest.spyOn(prover, "realLink", "get").mockImplementation(() => ({
        onBlock: () => {},
        hasValidInterlink: () => true,
        get: id => ({
          at: x => (x > 5 ? blockIds[0] : blockIds[toInt(id) - 1]),
          hash: () => Buffer.from("")
        })
      }));

      _mock(level).mockClear();
      _mock(level).mockImplementation(id => 5);
      const path = prover.followUp(blockIds[3], 5);
      expect(level).toHaveBeenCalledTimes(1);
      expect(path.map(toInt)).toEqual([2, 3]);
    });
  });
});
