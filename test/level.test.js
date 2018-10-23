// @flow

const { fromRev } = require("bcash/lib/utils/util");
const { fromInt } = require("math-buffer");
const level = require("../src/level");

describe("level", () => {
  it("returns the level", () => {
    expect(level(Buffer.from([1, 0, 0]), Buffer.from([0, 0, 1]))).toEqual(16);
  });

  it("works on target and id not being of the same length", () => {
    expect(level(fromInt(1))).toBeDefined();
  });

  it("works on zero", () => {
    expect(level(fromInt(0))).toBeDefined();
  });

  it("works on an actual testnet block id", () => {
    const bid = fromRev(
      "000000000000010cb677cf4c19e403728d3190a083c3086c5a93931ccb78e542"
    );

    expect(level(bid)).toEqual(23);
  });
});
