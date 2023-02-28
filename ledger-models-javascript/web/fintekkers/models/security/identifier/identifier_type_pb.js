// source: fintekkers/models/security/identifier/identifier_type.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    (function () { return this; }).call(null) ||
    Function('return this')();

goog.exportSymbol('proto.fintekkers.models.security.IdentifierTypeProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.security.IdentifierTypeProto = {
  UNKNOWN_IDENTIFIER_TYPE: 0,
  EXCH_TICKER: 1,
  ISIN: 2,
  CUSIP: 3,
  OSI: 4,
  FIGI: 5,
  CASH: 50
};

goog.object.extend(exports, proto.fintekkers.models.security);
