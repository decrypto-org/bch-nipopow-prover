// @flow

import type { BlockId, Level } from "./types";
const { BufferMap } = require("buffer-map");

export interface VelvetChain {
  genesis: ?BlockId;
  interlinkSizeOf(id: BlockId): number;
  idAt(i: number): BlockId;
  findVelvetUpchain(
    mu: Level,
    leftId: BlockId,
    rightId: ?BlockId
  ): {
    muSubchain: Array<BlockId>,
    wholePath: Array<BlockId>
  };
}
