// @flow

const _ = require("lodash");
const nullthrows = require("nullthrows");
const Prover = require("./Prover");
import type { BlockId } from "./types";
import type { VelvetChain } from "./VelvetChain";
const { followDown, goBack } = require("./followDown");
const { fromRev, revHex } = require("bcash/lib/utils/util");

function suffixProof({
  chain: C,
  k,
  m
}: {
  chain: VelvetChain,
  k: number,
  m: number
}): Array<BlockId> {
  let leftId = nullthrows(C.genesis);
  let pi: Array<BlockId> = [],
    chi: Array<BlockId> = [];
  let rightMostStableId = C.idAt(-k - 1);
  let maxMu = C.interlinkSizeOf(rightMostStableId);

  for (let mu = maxMu; mu >= 0; --mu) {
    let { muSubchain, wholePath } = C.findVelvetUpchain(
      mu,
      leftId,
      rightMostStableId
    );
    let newBlocks = wholePath;
    if (mu > 0) {
      if (muSubchain.length <= m) {
        continue;
      }
      leftId = muSubchain[muSubchain.length - m];
      let leftIdInWholePath = newBlocks.findIndex(id => id.equals(leftId));
      newBlocks = newBlocks.slice(0, leftIdInWholePath);
    }
    pi = pi.concat(newBlocks);
  }

  for (let i = -k; i < 0; ++i) {
    chi.push(C.idAt(i));
  }

  return pi.concat(chi);
}

function infixProof({
  chain: C,
  blockOfInterest: B,
  k,
  m
}: {
  chain: VelvetChain,
  blockOfInterest: BlockId,
  k: number,
  m: number
}): Array<BlockId> {
  const suffixP = suffixProof({ chain: C, k, m });
  if (suffixP.some(x => x.equals(B))) {
    return suffixP;
  }

  const pi = suffixP.slice(0, -k),
    chi = suffixP.slice(-k);

  const afterBIndex = _.findIndex(pi, e => C.heightOf(e) >= C.heightOf(B));
  const afterBBlock = pi[afterBIndex];
  const beforeBIndex = Math.max(afterBIndex - 1, 0);
  const beforeBBlock = pi[beforeBIndex];

  return [
    ...pi.slice(0, afterBIndex),
    ...goBack(C, B, beforeBBlock),
    B,
    ...followDown(C, afterBBlock, B),
    ...pi.slice(afterBIndex),
    ...chi
  ];
}

module.exports = { suffixProof, infixProof };
