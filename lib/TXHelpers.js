const {Script, MTX} = require('bcash');

const SPV_TAG = Buffer.from('interlink');

function taggedSPVOutput(buffer) {
  const script = new Script();
  script.pushOp(Script.opcodes.OP_RETURN);
  script.pushData(SPV_TAG);
  script.pushData(buffer);
  return script.compile();
}

module.exports = function taggedSPVTx(buffer) {
  const out = taggedSPVOutput(buffer);
  const mtx = new MTX();
  mtx.addOutput(out, 0);
  return mtx;
};
