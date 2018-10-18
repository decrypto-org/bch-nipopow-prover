// @flow

const {
  compose,
  map,
  prop,
  filter,
  equals,
  drop,
  head,
  dropWhile,
  not,
  unnest
} = require("ramda");

const VELVET_FORK_MARKER = Buffer.from("interlink");
const isBurnOutput = compose(
  equals(0),
  prop("value")
);
const dataInScript = compose(
  map(prop("data")),
  xs => [...xs.values()]
);
const discardEmpty = dropWhile(not);
const isInterlinkData = compose(
  equals(VELVET_FORK_MARKER),
  head
);
const getCleanScriptData = compose(
  discardEmpty,
  dataInScript
);

const extractInterlinkHashes = compose(
  map(
    compose(
      head,
      drop(1)
    )
  ),
  filter(isInterlinkData),
  map(
    compose(
      getCleanScriptData,
      prop("script")
    )
  ),
  filter(isBurnOutput),
  prop("outputs")
);

const extractInterlinkHashesFromMerkleBlock = compose(
  unnest,
  map(extractInterlinkHashes),
  prop("txs")
);

module.exports = {
  extractInterlinkHashes,
  extractInterlinkHashesFromMerkleBlock
};
