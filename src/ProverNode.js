// @flow

const bcash = require("bcash");
const pEvent = require("p-event");
const _ = require("lodash");

const Interlink = require("./Interlink");
const Prover = require("./Prover");

const {suffixProof} = require('./nipopow');

const { TESTNET_GENESIS_ID, VELVET_FORK_MARKER } = require("./constants");

const MAX_WAIT_FOR_SYNC_MS = 20000;

module.exports = class ProverNode extends bcash.SPVNode {
  prover: Prover;
  onSync: () => void;

  constructor(opts: {}) {
    super(opts);
    this.prover = new Prover();
    this.onSync = _.debounce(this.onSync.bind(this), MAX_WAIT_FOR_SYNC_MS);
  }

  async open() {
    this.setCallbacks();
    await super.open();
  }

  async connect() {
    this.pool.watch(Buffer.from(VELVET_FORK_MARKER));
    await super.connect();
  }

  setCallbacks() {
    this.on("block", (blk: bcash.MerkleBlock) => {
      this.prover.onBlock(blk, this.chain.height);
    });
    this.on("block", this.onSync);
    this.on("error", err => {
      console.log("callback error:", err);
    });
    this.onSync();
  }

  onSync() {
    console.log("chain synced!");
    console.log(suffixProof({chain: this.prover, m: 5, k: 5}));
  }
};
