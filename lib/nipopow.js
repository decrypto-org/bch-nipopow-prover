const {Set} = require('immutable');

function suffixProof({chain: C, k, m}) {
  let B = C.at(0);
  let pi = Set(), chi;

  for (let mu = C.at(-k).level; mu >= 0; --mu) {
    let alpha = C.slice(0, -k).fromBlock(B.id).upchain(mu);
    if (alpha.length < m)
      continue;

    pi = pi.union(alpha.list);
    B = alpha.at(-m);
  }

  chi = C.slice(-k).list;

  return {
    pi,
    chi
  };
}

module.exports = {suffixProof};
