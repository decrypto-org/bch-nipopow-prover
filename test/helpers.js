// @flow

const {
  util: { revHex, fromRev }
} = require("bcash");
const { fromInt } = require("math-buffer");
const { range } = require("lodash");
const fs = require("fs");

function fileLog(...msg: any) {
  fs.appendFileSync("log", msg.join() + "\n");
}

function overwriteLog() {
  // $FlowFixMe
  console.log = fileLog;
}

function toInt(buf: Buffer): number {
  return parseInt("0x" + revHex(buf));
}

function _mock(mockFn: any) {
  return (mockFn: any);
}

module.exports = { toInt, fromInt, range, revHex, fromRev, _mock, overwriteLog };
