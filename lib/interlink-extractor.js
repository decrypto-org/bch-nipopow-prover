const {compose, map, prop, filter, equals, drop, head, dropWhile, not, length, unnest} = require('ramda');

const VELVET_FORK_MARKER = Buffer.from('interlink');
const isBurnOutput = compose(equals(0), prop('value'));
const dataInScript = compose(map(prop('data')), xs => [...xs.values()]);
const discardEmpty = dropWhile(not);
const isInterlinkData = compose(equals(VELVET_FORK_MARKER), head);

module.exports = function extractInterlinkHashes(tx) {
  const candidateOutputs = filter(isBurnOutput, tx.outputs);
  const candidateScripts = map(prop('script'), candidateOutputs);
  const datas = map(compose(discardEmpty, dataInScript), candidateScripts);
  const interlinkDatas = filter(isInterlinkData, datas);
  return compose(unnest, filter(compose(equals(1), length)), map(drop(1)))(interlinkDatas);
};
