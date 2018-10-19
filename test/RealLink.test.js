const { fromInt } = require("math-buffer");
const RealLink = require("../src/RealLink");
const Interlink = require("../src/Interlink");

const mockInterlinkUpdate = jest.fn();
jest.mock("../src/Interlink", () => {
  return jest.fn().mockImplementation(() => {
    return {
      update: mockInterlinkUpdate
    };
  });
});

const blocks = [0, 1, 2].map(fromInt);

describe("RealLink", () => {
  beforeEach(() => {
    Interlink.mockClear();
    mockInterlinkUpdate.mockClear();
  });

  it("will be created", () => {
    const real = new RealLink();
    expect(Interlink).toHaveBeenCalled();
  });

  it("will update the running interlink based on the given id", () => {
    const real = new RealLink();
    real.onBlock(blocks[0], []);
    expect(mockInterlinkUpdate).toHaveBeenCalledWith(blocks[0]);
  });

  it("will mark a block as valid", () => {
    let counter = 0;
    const mockInterlinkHash = jest.fn(() => {
      return ["bar", "foo"].map(Buffer.from)[counter++];
    });

    Interlink.mockImplementation(() => {
      return {
        update: () => {
          return new Interlink();
        },
        hash: mockInterlinkHash
      };
    });

    const real = new RealLink();
    real.onBlock(blocks[0], [Buffer.from("foo")]);
    real.onBlock(blocks[1], [Buffer.from("foo")]);
    expect(mockInterlinkHash).toHaveBeenCalled();
    expect(real.hasValidInterlink(blocks[0])).toBe(false);
    expect(real.hasValidInterlink(blocks[1])).toBe(true);
  });
});
