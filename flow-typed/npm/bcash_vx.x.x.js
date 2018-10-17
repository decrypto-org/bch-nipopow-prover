// This is a work-in-progress attempt to type the bcash library.

type Hash = (string | Buffer);
type Height = number;
type Network = any;

declare class bcash$NodeClient {}

declare class bcash$FullNode {
  network : bcash$Network;
  pool : bcash$Pool;
  spv : boolean;
  chain : bcash$Chain;

  on(eventName : string, eventHandler : Function) : void;
  use(walletPlugin : bcash$WalletPlugin) : void;
  require(name : string) : bcash$WalletDB;
  open() : Promise<void>;
  close() : Promise<void>;
  connect() : Promise<void>;
  disconnect() : Promise<void>;
  getCoin(hash : Hash, index : number) : bcash$Coin;
}

declare class bcash$SPVNode {
  network : bcash$Network;
  pool : bcash$Pool;
  spv : boolean;
  chain : bcash$Chain;

  constructor(opts: {}): bcash$SPVNode; // TODO: better specify options
  on(eventName : string, eventHandler : Function) : void;
  use(walletPlugin : bcash$WalletPlugin) : void;
  require(name : string) : bcash$WalletDB;
  open() : Promise<void>;
  close() : Promise<void>;
  connect() : Promise<void>;
  disconnect() : Promise<void>;
  getCoin(hash : Hash, index : number) : bcash$Coin;
  startSync(): void;
}

declare class bcash$Network {}

declare class bcash$Chain {
  height: number;
  synced: boolean;

  reset(block: Hash | Height): Promise<void>;
}

declare class bcash$WalletDB {
  open() : Promise<void>;
  close() : Promise<void>;
  connect() : Promise<void>;
  disconnect() : Promise<void>;
  create(options : ?Object) : Promise<bcash$Wallet>;
}

declare class bcash$Wallet {
  getTX(hash : Hash) : Promise<bcash$TXRecord>;
}

declare type bcash$WalletPlugin = {
  init(node : (bcash$FullNode | bcash$SPVNode)) : bcash$WalletDB;
}

declare class bcash$Pool {
  peers : bcash$PeerList;
  spvFilter : bcash$Bloom;

  watchAddress(address : (bcash$Address | Buffer)) : void;
  watchOutpoint(outpoint : bcash$Outpoint) : void;
  watch(data: Buffer | Hash, enc: ?buffer$Encoding): void;
  unwatch(): void;
  hasTX(hash : Hash) : boolean;
}

declare class bcash$Bloom {
  test(val : (Buffer | string), enc :
    (typeof undefined | string)) : boolean;
  add(val : (Buffer | string), enc : ?string) : void;
}

declare class bcash$Peer {}

declare class bcash$PeerList {
  get(hostname : string) : bcash$Peer;
  add(peer : bcash$Peer) : void;
  head() : bcash$Peer;
  next() : bcash$Peer;
}

declare class bcash$Address {
  hash : Buffer;
  static types : {
     PUBKEYHASH : number
  };

  toString() : string;
  static fromHash(Hash) : bcash$Address;
  static fromString(string) : bcash$Address;
}

declare class bcash$TX {
  inputs : bcash$Input[];
  outputs : bcash$Output[];

  hash(enc : ?'hex') : Buffer;
  getOutputValue() : number;
}

declare class bcash$TXRecord {
  tx : bcash$TX;
  hash : Hash;
}

declare class bcash$MTX {
  inputs : bcash$Input[];
  outputs : bcash$Output[];

  toTX() : bcash$TX;
  template(ring : bcash$KeyRing) : number;
  scriptVector(outputScript : bcash$Script, ring : bcash$KeyRing) : bcash$Stack;
  addOutput(output : bcash$Output) : void;
  addCoin(coin : bcash$Coin) : void;
  addInput(input : (bcash$Input | Object)) : void;
  sign(ring : bcash$KeyRing) : number;
  signInput(index : number, coin : bcash$Coin, keyRing : bcash$KeyRing) : boolean;
}

declare class bcash$Output {
  script : bcash$Script;
  value : number;

  getType() : ('pubkeyhash' | 'multisig');
  getAddress() : bcash$Address;
}

declare class bcash$Input {
  static fromOutpoint(outpoint : bcash$Outpoint) : bcash$Input;

  script : bcash$Script;
  prevout : bcash$Outpoint;

  getType() : ('pubkeyhash' | 'multisig');
  getAddress() : bcash$Address;
}

declare class bcash$Script {
  static fromMultisig(m : number, n : number, keys : Buffer[]) : bcash$Script;
  static fromPubkeyhash(hash : Hash) : bcash$Script;
  static fromStack(stack : bcash$Stack) : bcash$Script;
  static isScript(script : bcash$Script) : boolean;

  get(n : number) : bcash$Opcode;
}

declare class bcash$Stack {
}

declare class bcash$Outpoint {
  hash : Buffer;
  index : number;

  txid() : Buffer;
}

declare class bcash$Opcode {
  value : number;
  data : Buffer;
}

declare class bcash$KeyRing {
  static fromPrivate(key : Buffer, compressed : ?boolean, network : ?Network) : bcash$KeyRing;
  static fromPublic(key : Buffer, network : ?Network) : bcash$KeyRing;

  getPublicKey() : Buffer;
  getPrivateKey() : Buffer;
  getAddress() : Buffer;
}

declare class bcash$Coin extends bcash$Output {
  script : bcash$Script;
  value : number;

  static fromTX(tx : bcash$TX, index : number, height : number) : bcash$Coin;
}

declare class bcash$AbstractBlock {
  version: number;
  prevBlock: Hash;
  merkleRoot: Hash;
  time: number;
  bits: number;
  nonce: number;

  hash(enc : 'hex'): Hash;
  hash(?null): Buffer;
  rhash(): Hash;
}

declare class bcash$MerkleBlock extends bcash$AbstractBlock {
  txs: Array<bcash$TX>;
  hashes: Array<Hash>;
  flags: number;

  hasTX(hash: Hash): boolean;
}

declare module 'bcash' {
  declare module.exports: {
    node : {
      NodeClient : Class<bcash$NodeClient>
    },
    FullNode : Class<bcash$FullNode>,
    SPVNode : Class<bcash$SPVNode>,
    Script : Class<bcash$Script>,
    pool : Class<bcash$Pool>,
    wallet : {
      Wallet : Class<bcash$Wallet>,
      WalletDB : Class<bcash$WalletDB>,
      plugin : bcash$WalletPlugin
    },
    primitives : {
      Address : Class<bcash$Address>,
      TX : Class<bcash$TX>,
      MTX : Class<bcash$MTX>,
      Output : Class<bcash$Output>,
      Input : Class<bcash$Input>,
      Outpoint : Class<bcash$Outpoint>,
      KeyRing : Class<bcash$KeyRing>,
      Coin : Class<bcash$Coin>
    },
    base58 : {
      encode(str : (string | Buffer)) : Buffer
    },
    MerkleBlock: Class<bcash$MerkleBlock>,
    util: {
      revHex(buf: Buffer): string;
      fromRev(str: string): Buffer;
      // TODO: add the rest
    }
  }
}
