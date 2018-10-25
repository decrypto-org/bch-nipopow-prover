const BlockLoader = require("../src/BlockLoader");
const Prover = require("../src/Prover");
const { suffixProof } = require("../src/nipopow");
const { TESTNET_GENESIS_HEIGHT } = require("../src/constants");
const _ = require("lodash");

console.log = jest.fn();

test("produces a valid suffix proof for the bch testnet velvet fork", () => {
  const blockLoader = new BlockLoader(
    "./test/data/bcash-testnet-merkleblocks-huge.json"
  );
  const prover = new Prover();
  let height = TESTNET_GENESIS_HEIGHT;
  for (let blk of blockLoader.getBlocks()) {
    prover.onBlock(blk, height++);
  }

  let k = 5;
  let lastStableBlockId = prover.idAt(-k - 1);

  expect(lastStableBlockId).toBeDefined();

  let stableInterlinkSize = prover.interlinkSizeOf(lastStableBlockId);
  expect(stableInterlinkSize).toBeDefined();
  expect(stableInterlinkSize).toBeGreaterThan(1);
  let proof = suffixProof({ chain: prover, k: 5, m: 1 });
  expect(proof.length).toBeGreaterThan(5);
  expect(proof.length).toBeLessThanOrEqual(5794);
  expect(_.uniqWith(proof, _.isEqual)).toEqual(proof);
  console.log(proof.length);
});
