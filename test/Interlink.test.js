// @flow

const Interlink = require("../src/Interlink");
const { fromInt } = require("math-buffer");

describe("Interlink", () => {
  it("has a length", () => {
    const interlink = new Interlink(Buffer.from("gen"));
    expect(interlink.length).toBeDefined();
  });

  it("returns genesis on level > size", () => {
    const GEN = Buffer.from("genesis");
    const interlink = new Interlink(GEN);

    interlink.update(Buffer.from("nongenesis"));

    const INFINITY = 999999;
    expect(interlink.at(INFINITY)).toBeDefined();
    expect(interlink.at(INFINITY)).toEqual(Buffer.from("genesis"));
  });
});
