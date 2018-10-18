// @flow

const { util } = require("bcash");

module.exports = {
  TESTNET_GENESIS_HEIGHT: 1257602,
  TESTNET_GENESIS_ID: util.fromRev(
    "00000000000001934669a81ecfaa64735597751ac5ca78c4d8f345f11c2237cf"
  ),
  TESTNET_MAX_TARGET: util.fromRev(
    "ffff0000000000000000000000000000000000000000000000000000"
  ),
  VELVET_FORK_MARKER: "interlink"
};
