// @flow
const fs = require("fs").promises;
const path = require("path");
const { compose, composeP, map, curryN, curry, flip } = require("ramda");

const DATA_DIR = path.join(__dirname, "data");
const prependDataPath = curryN(2, path.join)(DATA_DIR);

const readJSONFile = composeP(
  JSON.parse,
  fs.readFile
);

const txFileName = height => `bcash-testnet-block-${height}-txs.json`;
const txFile = compose(
  prependDataPath,
  txFileName
);

const merkleBlockFileName = height =>
  `bcash-testnet-block-${height}-merkleblock.json`;
const merkleBlockFile = compose(
  prependDataPath,
  merkleBlockFileName
);

const readTXFile = compose(
  readJSONFile,
  txFile
);
const readMerkleBlockFile = compose(
  readJSONFile,
  merkleBlockFile
);

const b = hex => Buffer.from(hex, "hex");

const { TX } = require("bcash");
const MerkleBlockSerializer = require("../src/MerkleBlockSerializer");
const {
  extractInterlinkHashes,
  extractInterlinkHashesFromMerkleBlock
} = require("../src/interlinkExtractor");

test("extracts interlink hashes from tx", async () => {
  const [txJSON] = await readTXFile(1260212);
  const tx = TX.fromJSON(txJSON);
  const extracted = extractInterlinkHashes(tx);
  expect(extracted).toEqual([
    b("aeed62c94315f1e45d4fa9027c9c973d1148f9c0a3dc749c70aa0db0e92cc894")
  ]);
});

test("extracts interlink hashes from merkeblock", async () => {
  const merkleBlockJSON = await readMerkleBlockFile(1260339);
  const merkleBlock = MerkleBlockSerializer.deserialize(merkleBlockJSON);
  const extracted = extractInterlinkHashesFromMerkleBlock(merkleBlock);
  expect(extracted).toEqual([
    b("3ed9f218fcd415e036ccd4b485f252f1dc30db43320d51721b17462a0485a25a"),
    b("3ed9f218fcd415e036ccd4b485f252f1dc30db43320d51721b17462a0485a25a")
  ]);
});
