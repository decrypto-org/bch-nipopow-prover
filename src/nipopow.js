// @flow

const Prover = require('./Prover');
import type {BlockId} from './types';

function suffixProof({chain: C, k, m}: {
  chain: Prover,
  k: number,
  m: number
}): Array<BlockId> {
  if (!C.genesis) {
    throw new Error('no genesis');
  }
  let leftId = C.genesis;
  let pi: Array<BlockId> = [], chi: Array<BlockId> = [];
  let rightMostStableId = C.idAt(-k-1);
  let maxMu = C.realLink.get(rightMostStableId).length;

  for (let mu = maxMu; mu >= 0; --mu) {
    let {actuallyOnMu, wholePath} = C.findUpchain(mu, leftId, rightMostStableId);
    if (actuallyOnMu.length <= m) {
      continue;
    }
    leftId = actuallyOnMu[actuallyOnMu.length - m];
    let startingIdInWholePath = wholePath.findIndex(id => id.equals(leftId));
    pi = pi.concat(wholePath.slice(0, startingIdInWholePath));
  }

  for (let i = -k; i < 0; --i) {
    chi.push(C.idAt(i));
  }

  return pi.concat(chi);
}

module.exports = {suffixProof};
