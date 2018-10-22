const BlockLoader = require("../src/BlockLoader");
const Prover = require("../src/Prover");
const { suffixProof } = require("../src/nipopow");
const { TESTNET_GENESIS_HEIGHT } = require("../src/constants");

test("produces a valid suffix proof for the bch testnet velvet fork", () => {
  const blockLoader = new BlockLoader(
    "./test/data/bcash-testnet-merkleblocks-huge.json"
  );
  const prover = new Prover();
  let height = TESTNET_GENESIS_HEIGHT;
  for (let blk of blockLoader.getBlocks()) {
    prover.onBlock(blk, height++);
  }
  expect(suffixProof({ chain: prover, k: 5, m: 1 }).length).toBeGreaterThan(5);
});
