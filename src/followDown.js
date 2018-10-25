// @flow

import type { BlockId } from "./types";
import type { VelvetChain } from "./VelvetChain";
const level = require("./level");

module.exports = function followDown(C: VelvetChain, hi: BlockId, lo: BlockId) {
  let B = hi;
  let aux = [];
  let mu = level(hi);
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
};
