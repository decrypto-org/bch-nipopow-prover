// @flow

const {Set} = require('immutable');

function suffixProof({chain: C, k, m}) {
  let B = C.genesis;
  let pi = Set(), chi;

  for (let mu = C.realLink(-k-1).length; mu >= 0; --mu) {
    let {pi: alpha, aux} = C.findUpchain(mu, B.id, C.at(-k).id);

    if (alpha.length >= m)
      B = alpha[alpha.length - m];
    
    // TODO: actually fix union
    let cut = mu > 0 ? m : 0;
    pi = pi.union(aux, alpha.slice(0, alpha.length - cut));
  }

  chi = C.slice(-k);

  return {
    pi,
    chi
  };
}

module.exports = {suffixProof};