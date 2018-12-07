// @flow

import type { BlockId } from "./types";
import type { VelvetChain } from "./VelvetChain";
const level = require("./level");
const assert = require("assert");

function followDown(C: VelvetChain, hi: BlockId, lo: BlockId) {
  let B = hi;
  let aux = [];
  let mu = level(hi);
  assert(C.heightOf(hi) >= C.heightOf(lo));
  while (!B.equals(lo)) {
    let Bp = C.levelledPrev(B, mu);
    if (C.heightOf(Bp) < C.heightOf(lo)) {
      --mu;
    } else {
      if (!B.equals(hi)) {
        aux = [B, ...aux];
      }
      B = Bp;
    }
  }
  return aux;
}

function goBack(C: VelvetChain, lo: BlockId, hi: BlockId) {
  let aux = [];
  assert(C.heightOf(hi) <= C.heightOf(lo));
  while (!lo.equals(hi)) {
    for (let mu = level(hi); mu >= 0; --mu) {
      const b = C.levelledPrev(lo, mu);
      if (C.heightOf(b) >= C.heightOf(hi)) {
        lo = b;
        aux.unshift(lo);
        break;
      }
    }
  }
  aux.shift();
  return aux;
}

module.exports = { followDown, goBack };
