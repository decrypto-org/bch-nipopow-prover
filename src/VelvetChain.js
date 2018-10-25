// @flow

import type { BlockId, Level } from "./types";
const { BufferMap } = require("buffer-map");

const Interlink = require("./Interlink");

export interface VelvetChain {
  genesis: ?BlockId;
  interlinkSizeOf(id: BlockId): number;
  idAt(i: number): BlockId;
  levelledPrev(id: BlockId, mu: Level): BlockId;
  heightOf(id: BlockId): number;
  findVelvetUpchain(
    mu: Level,
    leftId: BlockId,
    rightId: ?BlockId
  ): {
    muSubchain: Array<BlockId>,
    wholePath: Array<BlockId>
  };
}
