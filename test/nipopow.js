// @ts-check
const {test} = require('tap');
const sinon = require('sinon');
const {spy} = sinon;
const chai = require('chai');
const {expect} = chai;
chai.use(require('sinon-chai'));

const {suffixProof} = require('../lib/nipopow');

function b(x) {
  return Buffer.from([x]);
}

class MockChain {
  constructor() {
    this.levels = [Infinity, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0];
  }

  at(i) {
    return {id: b((i + 15) % 15), level: this.levels[(i + 15) % 15]};
  }

  get genesis() {
    return {id: b(0), level: Infinity};
  }

  realLink(id) {
    id = (id + 15) % 15;
    let levelsBefore = this.levels.filter((_, idx) => idx > 0 && idx < id);
    return {length: Math.max(...levelsBefore)}
  }

  findUpchain(level, leftId, rightId) {
    leftId = leftId[0];
    rightId = rightId[0];
    const fullPi = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      [0, 1, 3, 5, 7, 9, 11, 13],
      [0, 3, 7, 11],
      [0, 7]
    ][level];
    return {pi: fullPi.filter(x => x >= leftId && x < rightId).map(x => this.at(x)), aux: []};
  }

  slice(i) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].slice((i + 15) % 15).map(x => this.at(x));
  }
}

function bufferMatch(expected) {
  return sinon.match.instanceOf(Buffer)
    .and(sinon.match(function (x) {
      return x.equals(expected);
    }));
}

test('creates suffix proof', async function(t) {
  const mockChain = new MockChain();

  spy(mockChain, 'findUpchain');
  spy(mockChain, 'slice');
  spy(mockChain, 'at');

  let proof = suffixProof({chain: mockChain, m: 1, k: 1});

  expect(mockChain.slice).to.have.been.calledOnceWith(-1);
  expect(mockChain.findUpchain).to.have.callCount(4);

  // TODO: represent those as in sequence?
  expect(mockChain.findUpchain).to.have.been.calledWith(3, bufferMatch(b(0)), bufferMatch(b(14)));
  expect(mockChain.findUpchain).to.have.been.calledWith(2, bufferMatch(b(7)), bufferMatch(b(14)));
  expect(mockChain.findUpchain).to.have.been.calledWith(1, bufferMatch(b(11)), bufferMatch(b(14)));
  expect(mockChain.findUpchain).to.have.been.calledWith(0, bufferMatch(b(13)), bufferMatch(b(14)));

  expect(proof.chi.map(x => x.id)).to.deep.equal([b(14)]);
  expect(proof.pi.map(x => x.id)).to.deep.equal(Set.of(b(0), b(7), b(11), b(13)));

  t.end();
});
