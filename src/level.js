// @flow

const { shift, compare } = require('math-buffer');

import type {BlockId} from './types';
const {TESTNET_MAX_TARGET} = require('./constants');

module.exports = function level(blockId: BlockId, target?: BlockId) {
  target = target || TESTNET_MAX_TARGET;
  let tar = Buffer.from(target);
  let shifts = 0;
  while (compare(blockId, tar) <= 0) {
    shift(tar, -1, tar);
    ++shifts;
  }
  return shifts - 1;
};
