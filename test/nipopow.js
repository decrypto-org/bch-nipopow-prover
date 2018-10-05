const {test} = require('tap');
const {Set} = require('immutable');

const Chain = require('../lib/chain');
const {suffixProof} = require('../lib/nipopow');

test('creates suffix proof', async function(t) {
  let chain = Chain.of([
    {id: 1, level: Infinity},
    {id: 2, level: 1},
    {id: 3, level: 1},
    {id: 4, level: 2},
    {id: 5, level: 2},
    {id: 6, level: 3}
  ]);
  let c = xs => xs.map(x => chain.getBlock(x));

  t.nipopowEqual = (nipopow, expected) => {
    const {pi, chi} = nipopow;
    const expectedPi = Set(c(expected.pi)),
      expectedChi = c(expected.chi);

    t.ok(pi.equals(expectedPi));
    t.same(chi, expectedChi);
  };

  t.nipopowEqual(suffixProof({chain, k: 1, m: 2}),
    {
      pi: [1, 4, 5],
      chi: [6]
    }
  );

  t.nipopowEqual(suffixProof({chain, k: 2, m: 2}),
    {
      pi: [1, 2, 3, 4],
      chi: [5, 6]
    }
  );
  t.end();
});
