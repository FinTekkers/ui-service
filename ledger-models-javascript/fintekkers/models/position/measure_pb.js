// source: fintekkers/models/position/measure.proto
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

goog.exportSymbol('proto.fintekkers.models.position.MeasureProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.position.MeasureProto = {
  UNKNOWN_MEASURE: 0,
  DIRECTED_QUANTITY: 1,
  MARKET_VALUE: 2,
  UNADJUSTED_COST_BASIS: 3,
  ADJUSTED_COST_BASIS: 4,
  CURRENT_YIELD: 5,
  YIELD_TO_MATURITY: 7
};

goog.object.extend(exports, proto.fintekkers.models.position);
