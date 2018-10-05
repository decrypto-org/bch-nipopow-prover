const {test} = require('tap');
const {stub} = require('sinon');
const Chain = require('../lib/chain');

test('upchain', function(t) {
  let chain = [
    {id: 0, prev: null, level: 0},
    {id: 1, prev: 0, level: 1},
    {id: 2, prev: 1, level: 1},
    {id: 3, prev: 2, level: 2},
    {id: 4, prev: 3, level: 2},
    {id: 5, prev: 4, level: 3}
  ];
  let c = xs => xs.map(x => chain[x]);
  t.same([...Chain.of(chain).upchain(3).list], c([ 5 ]));
  t.same([...Chain.of(chain).upchain(2).list], c([ 3, 4, 5 ]));
  t.same([...Chain.of(chain).upchain(1).list], c([ 1, 2, 3, 4, 5 ]));
  t.same([...Chain.of(chain).upchain(0).list], c([ 0, 1, 2, 3, 4, 5 ]));
  t.end();
});

test('at', function(t) {
  let first = stub(), second = stub();
  const chain = Chain.of([first, second]);
  t.same(chain.at(0), first);
  t.same(chain.at(1), second);
  t.same(chain.at(-1), second);
  t.end();
});

test('fromBlock', function(t) {
  const chain = Chain.of([
    {id: 5},
    {id: 4},
    {id: 0},
    {id: 6},
    {id: 7}
  ]);

  t.same(chain.fromBlock(0), Chain.of([0, 6, 7].map(id => ({id}))));
  t.end();
});
