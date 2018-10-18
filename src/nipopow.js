// @flow

const Prover = require("./Prover");
import type { BlockId } from "./types";
import type { VelvetChain } from "./VelvetChain";

function suffixProof({
  chain: C,
  k,
  m
}: {
  chain: VelvetChain,
  k: number,
  m: number
}): Array<BlockId> {
  if (!C.genesis) {
    throw new Error("no genesis");
  }
  let leftId = C.genesis;
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

module.exports = { suffixProof };
