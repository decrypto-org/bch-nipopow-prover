// @flow

const Prover = require('../src/Prover');
const {
  extractInterlinkHashesFromMerkleBlock
} = require("../src/interlinkExtractor");
jest.mock("../src/interlinkExtractor");
extractInterlinkHashesFromMerkleBlock.mockImplementation(() => ([]));

describe("Prover", () => {
  it("can be instantiated", () => {
    const prover = new Prover();
  });

  function blockFromId(id): bcash$MerkleBlock {
    return ({
      hash: jest.fn(() => id),
    }: any);
  }

  function proverWithBlocks(blockIdList) {
    const prover = new Prover();
    let height = 0;
    for (let id of blockIdList) {
      prover.onBlock(blockFromId(id), ++height);
    }
    return prover;
  }

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
    let one = Buffer.from("one"), two = Buffer.from("two");
    const prover = proverWithBlocks([one, two]);
    expect(prover.idAt(-1)).toEqual(two);
  });

  it("will ignore duplicate blocks", () => {
    let one = Buffer.from("one"), two = Buffer.from("two");
    const prover = proverWithBlocks([one, two]);
    prover.onBlock(blockFromId(one), 0);
    expect(prover.idAt(-1)).toEqual(two);
  });

  it("throws when asked about unknown blocks", () => {
    let foo = Buffer.from("foo"), bar = Buffer.from("bar");
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
});
