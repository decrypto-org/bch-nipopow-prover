// @flow

const { shift, compare } = require("math-buffer");

import type { BlockId } from "./types";
const { TESTNET_MAX_TARGET } = require("./constants");

const ZERO = Buffer.from([0]);

const equal = (x, y) => compare(x, y) === 0;
const lessThanOrEqual = (x, y) => compare(x, y) <= 0;

module.exports = function level(blockId: BlockId, target?: BlockId) {
  target = target || TESTNET_MAX_TARGET;
  let tar = Buffer.from(target);
  let shifts = 0;

  if (equal(ZERO, blockId)) {
    return Infinity;
  }

  while (lessThanOrEqual(blockId, tar)) {
    shift(tar, -1, tar);
    ++shifts;
  }
  return shifts - 1;
};
