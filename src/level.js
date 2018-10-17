// @flow

const { util } = require('bcash');
const { shift, compare } = require('math-buffer');

import type {BlockId} from './types';

const MAX_TARGET =
  util.fromRev('ffff0000000000000000000000000000000000000000000000000000');

module.exports = function level(blockId: BlockId, target: BlockId) {
  target = target || MAX_TARGET;
  let tar = Buffer.from(target);
  let shifts = 0;
  while (compare(blockId, tar) <= 0) {
    shift(tar, -1, tar);
    ++shifts;
  }
  return shifts - 1;
};
