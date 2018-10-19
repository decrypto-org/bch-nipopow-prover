// @flow

const level = require("../src/level");

describe("level", () => {
  it("returns the level", () => {
    expect(level(Buffer.from([1, 0, 0]), Buffer.from([0, 0, 1]))).toEqual(16);
  });
});
