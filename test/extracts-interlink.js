const {test} = require('tap');
const fs = require('fs').promises;
const path = require('path');
const {compose, composeP, map, curryN, curry, flip} = require('ramda');

const extractInterlinkHashes = require('../lib/interlink-extractor');

const readJSONFile = composeP(JSON.parse, fs.readFile);
const DATA_DIR = path.join(__dirname, 'data');
const blockFileName = height => `bcash-testnet-block-${height}-txs.json`;
const blockFile = compose(curryN(2, path.join)(DATA_DIR), blockFileName);
const readBlockFile = compose(readJSONFile, blockFile);

const b = hex => Buffer.from(hex, 'hex');

const {TX} = require('bcash');

test('extracts interlink hashes from tx', async function(t) {
  const [txJSON] = await readBlockFile(1260212);
  const tx = TX.fromJSON(txJSON);
  const extracted = extractInterlinkHashes(tx);
  t.equal(extracted.length, 1);
  t.same(extracted[0], b('aeed62c94315f1e45d4fa9027c9c973d1148f9c0a3dc749c70aa0db0e92cc894'));
});
