const bcash = require('bcash');
const {fromRev, revHex} = require('bcash/lib/utils/util');
const pEvent = require('p-event');

const Interlink = require('./Interlink');

const MARKED_BLOCK_HASH =
  fromRev('00000000000001934669a81ecfaa64735597751ac5ca78c4d8f345f11c2237cf');
const VELVET_FORK_MARKER = 'interlink';

module.exports = class ProverNode extends bcash.SPVNode {
  constructor(opts) {
    super(opts);
  }

  async connect() {
    await super.connect();
    this.pool.watch(Buffer.from(VELVET_FORK_MARKER));
  }
};
