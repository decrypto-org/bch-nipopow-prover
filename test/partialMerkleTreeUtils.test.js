const hash256 = require('bcrypto/lib/hash256');
const {extractTree, prune, gatherProof} = require('../src/partialMerkleTreeUtils');

function str2hex(s) {
  const unbuffered = s.replace(/<Buffer (.*)>/, '$1');
  const unspaced = unbuffered.replace(/ /g, '');
  return new Buffer(unspaced, 'hex');
}

const flags = [ 235, 1 ];
const hashes = [ '<Buffer 19 d6 5e 9e 20 d4 55 db ae 6d 11 39 66 54 7a 1d 41 91 e3 cf eb 3c 4c 2a b9 0e d2 79 5f 39 c4 cc>',
  '<Buffer 05 6b 4e 64 69 76 77 78 87 44 a8 ad 23 cc 40 7c bc 1c 35 7f f8 89 d9 97 5e dd 43 1f b7 79 46 6f>',
  '<Buffer 3c 51 bf b4 f9 cd d2 b8 e3 a5 c4 7c b1 b3 bd bc 88 79 a1 c1 b2 38 d4 12 3d cb 57 2a 00 b2 b8 0e>',
  '<Buffer d6 d1 f9 ca 0a 40 17 05 03 79 a8 2e cc cb 05 0c f4 21 8f 21 80 08 7e 95 92 11 09 72 a7 1e 37 5c>' ].map(str2hex);
const numTransactions = 5;
const merkleRoot = str2hex('<Buffer b9 b4 50 02 94 c1 84 87 dc 32 a9 29 b5 87 47 5f bf 96 52 be b7 d7 30 10 ea 37 ee 04 83 e5 2e 58>');

describe('extractTree', () => {
  it('produces a tree with the correct merkle root', () => {
    const result = extractTree(hashes, flags, numTransactions);
    expect(result).not.toBeNull();
    expect(result.hash).toEqual(merkleRoot);
  });
});

describe('prune', () => {
  it('decreases the number of leaf nodes', () => {
    const tree = extractTree(hashes, flags, numTransactions);
    function countLeaves(r) {
      if (r.isLeaf()) {
        return 1;
      }
      let ret = countLeaves(r.left);
      if (r.right)
        ret += countLeaves(r.right);
      return ret;
    }

    const prunedTree = prune(tree, new Buffer('d6d1f9ca0a4017050379a82ecccb050cf4218f2180087e9592110972a71e375c', 'hex'));
    expect(countLeaves(prunedTree)).toBeLessThan(countLeaves(tree));
  });
});

describe('gatherProof', () => {
  it('gathers a proof', () => {
    const tree = extractTree(hashes, flags, numTransactions);
    const leaf = new Buffer('d6d1f9ca0a4017050379a82ecccb050cf4218f2180087e9592110972a71e375c', 'hex');
    const proof = gatherProof(tree, leaf);
    let h = leaf;
    for (const {hash, left} of proof) {
      if (left)
        h = hash256.root(hash, h);
      else
        h = hash256.root(h, hash);
    }

    expect(h).toEqual(merkleRoot);
  });
});
