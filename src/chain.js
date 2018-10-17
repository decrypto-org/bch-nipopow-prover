class Chain {
  constructor(list) {
    this.list = list;
  }

  static of(list) {
    return new this(list);
  }

  upchain(mu) {
    return Chain.of(this.list.filter(x => x.level >= mu));
  }

  at(i) {
    if (i < 0) return this.list[this.list.length + i];
    return this.list[i];
  }

  slice(...args) {
    return Chain.of(this.list.slice(...args));
  }

  get length() {
    return this.list.length;
  }

  fromBlock(id) {
    const blockIndex = Math.max(0, this.list.findIndex(x => x.id === id));
    return this.slice(blockIndex);
  }

  getBlock(id) {
    return this.list[this.list.findIndex(x => x.id === id)];
  }
}

module.exports = Chain;
