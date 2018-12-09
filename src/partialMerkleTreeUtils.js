// @flow

const {BufferMap} = require('buffer-map');
const hash256 = require('bcrypto/lib/hash256');

const ZERO_HASH = Buffer.alloc(32, 0x00);

function extractTree(hashes: Array<Buffer>, flags: Array<number>, totalTX: number) {
  const matches = [];
  const indexes = [];
  const map = new BufferMap();

  let bitsUsed = 0;
  let hashUsed = 0;
  let height = 0;

  const width = (height) => {
    return (totalTX + (1 << height) - 1) >>> height;
  };

  const traverse = (height, pos) => {
    if (bitsUsed >= flags.length * 8) {
      throw new Error;
    }

    const parent = (flags[bitsUsed / 8 | 0] >>> (bitsUsed % 8)) & 1;

    bitsUsed += 1;

    if (height === 0 || !parent) {
      if (hashUsed >= hashes.length) {
        throw new Error;
      }

      const hash = hashes[hashUsed];

      hashUsed += 1;

      if (height === 0 && parent) {
        matches.push(hash);
        indexes.push(pos);
        map.set(hash, pos);
      }

      return new LeafNode(hash);
    }

    const left = traverse(height - 1, pos * 2);
    let right;

    const hasRightChild = (height, pos) => pos * 2 + 1 < width(height - 1);

    if (hasRightChild(height, pos)) {
      right = traverse(height - 1, pos * 2 + 1);
      if (right.hash.equals(left.hash))
        throw new Error;
      return new InternalNode(left, right);
    } else {
      return new InternalNode(left);
    }
  };

  if (totalTX === 0)
    throw new Error('Zero transactions.');

  // FIXME: Track the maximum block size we've seen and use it here.

  if (hashes.length > totalTX)
    throw new Error('Too many hashes.');

  if (flags.length * 8 < hashes.length)
    throw new Error('Flags too small.');

  while (width(height) > 1)
    height += 1;

  const root = traverse(height, 0);

  if (((bitsUsed + 7) / 8 | 0) !== flags.length)
    throw new Error('Too many flag bits.');

  if (hashUsed !== hashes.length)
    throw new Error('Incorrect number of hashes.');

  return root;
}

function prune(root: InternalNode, keepLeaf: Buffer) {
  let left = root.left, right = root.right;
  if (!root.left.isParentOf(keepLeaf)) {
    left = new LeafNode(root.left.hash);
  }
  else if (root.left instanceof InternalNode) {
    left = prune(root.left, keepLeaf);
  }
  if (root.right && !root.right.isParentOf(keepLeaf)) {
    right = new LeafNode(root.right.hash);
  }
  else if (root.right instanceof InternalNode) {
    right = prune(root.right, keepLeaf);
  }
  return right ? new InternalNode(left, right) : new InternalNode(left);
}

function gatherProof(root: InternalNode, leaf: Buffer) {
  let hash, left, rest = [];
  if (root.left.isParentOf(leaf)) {
    if (root.right)
      hash = root.right.hash;
    else
      hash = root.left.hash;
    left = 0;
    if (root.left instanceof InternalNode)
      rest = gatherProof(root.left, leaf);
  }
  else {
    hash = root.left.hash;
    left = 1;
    if (root.right instanceof InternalNode)
      rest = gatherProof(root.right, leaf);
  }

  return [...rest, {hash, left}];
}

class TreeNode {
  get hash(): Buffer {
    return ZERO_HASH;
  }
  isParentOf(hash: Buffer) {
    return false;
  }
  isLeaf() {
    return false;
  }
}

class InternalNode extends TreeNode {
  left: TreeNode;
  right: ?TreeNode;
  value: ?Buffer;

  constructor(left: TreeNode, right?: TreeNode, value?: Buffer) {
    super();
    this.left = left;
    this.right = right;
    this.value = value;
  }

  get hash(): Buffer {
    if (this.value)
      return this.value;
    if (!this.right)
      return hash256.root(this.left.hash, this.left.hash);
    return hash256.root(this.left.hash, this.right.hash);
  }

  isParentOf(hash: Buffer) {
    let res = this.left.isParentOf(hash);
    if (this.right)
      res = res || this.right.isParentOf(hash);
    return res;
  }
}

class LeafNode extends TreeNode {
  value: Buffer;

  constructor(value: Buffer) {
    super();
    this.value = value;
  }

  get hash(): Buffer {
    return this.value;
  }

  isParentOf(hash: Buffer) {
    return hash.equals(this.value);
  }
  isLeaf() {
    return true;
  }
}

module.exports = {extractTree, prune, gatherProof};
