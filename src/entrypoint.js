// @flow

const fs = require("fs");
const ProverNode = require("./ProverNode");
const { TESTNET_GENESIS_HEIGHT } = require("./constants");

module.exports = async function() {
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
