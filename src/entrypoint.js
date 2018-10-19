// @flow

const assert = require("assert");
const ProverNode = require("./ProverNode");

const node = new ProverNode({
  config: true,
  argv: true,
  env: true,
  logFile: true,
  logConsole: false,
  logLevel: "info",
  db: "leveldb",
  memory: false,
  persistent: true,
  workers: true,
  listen: true,
  loader: require
});

process.on("unhandledRejection", (err, promise) => {
  throw err;
});

const fs = require("fs");
const { unnest, map, compose } = require("ramda");

const { TESTNET_GENESIS_HEIGHT } = require("./constants");
const { extractInterlinkHashes } = require("./interlinkExtractor");

const hexify = x => x.toString("hex");
const interlinksFromTxs = compose(
  map(hexify),
  unnest,
  map(extractInterlinkHashes)
);

module.exports = async function() {
  await node.ensure();
  console.log("prefix =", node.config.prefix);
  console.log("network =", node.chain.network);
  await node.open();
  await node.connect();
  node.startSync();
  await node.chain.reset(TESTNET_GENESIS_HEIGHT);

  setInterval(() => {
    console.log("height = %d", node.chain.height);
  }, 1000);
};
