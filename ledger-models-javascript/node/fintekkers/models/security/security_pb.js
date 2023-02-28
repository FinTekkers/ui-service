// source: fintekkers/models/security/security.proto
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
var global = (function() {
  if (this) { return this; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  if (typeof self !== 'undefined') { return self; }
  return Function('return this')();
}.call(null));

var fintekkers_models_util_decimal_value_pb = require('../../../fintekkers/models/util/decimal_value_pb.js');
goog.object.extend(proto, fintekkers_models_util_decimal_value_pb);
var fintekkers_models_util_local_date_pb = require('../../../fintekkers/models/util/local_date_pb.js');
goog.object.extend(proto, fintekkers_models_util_local_date_pb);
var fintekkers_models_util_local_timestamp_pb = require('../../../fintekkers/models/util/local_timestamp_pb.js');
goog.object.extend(proto, fintekkers_models_util_local_timestamp_pb);
var fintekkers_models_util_uuid_pb = require('../../../fintekkers/models/util/uuid_pb.js');
goog.object.extend(proto, fintekkers_models_util_uuid_pb);
var fintekkers_models_security_identifier_identifier_pb = require('../../../fintekkers/models/security/identifier/identifier_pb.js');
goog.object.extend(proto, fintekkers_models_security_identifier_identifier_pb);
var fintekkers_models_security_security_type_pb = require('../../../fintekkers/models/security/security_type_pb.js');
goog.object.extend(proto, fintekkers_models_security_security_type_pb);
var fintekkers_models_security_security_quantity_type_pb = require('../../../fintekkers/models/security/security_quantity_type_pb.js');
goog.object.extend(proto, fintekkers_models_security_security_quantity_type_pb);
var fintekkers_models_security_coupon_frequency_pb = require('../../../fintekkers/models/security/coupon_frequency_pb.js');
goog.object.extend(proto, fintekkers_models_security_coupon_frequency_pb);
var fintekkers_models_security_coupon_type_pb = require('../../../fintekkers/models/security/coupon_type_pb.js');
goog.object.extend(proto, fintekkers_models_security_coupon_type_pb);
goog.exportSymbol('proto.fintekkers.models.security.SecurityProto', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fintekkers.models.security.SecurityProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fintekkers.models.security.SecurityProto, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.models.security.SecurityProto.displayName = 'proto.fintekkers.models.security.SecurityProto';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fintekkers.models.security.SecurityProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.models.security.SecurityProto.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.models.security.SecurityProto} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.security.SecurityProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    uuid: (f = msg.getUuid()) && fintekkers_models_util_uuid_pb.UUIDProto.toObject(includeInstance, f),
    asOf: (f = msg.getAsOf()) && fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.toObject(includeInstance, f),
    isLink: jspb.Message.getBooleanFieldWithDefault(msg, 7, false),
    securityType: jspb.Message.getFieldWithDefault(msg, 10, 0),
    assetClass: jspb.Message.getFieldWithDefault(msg, 11, ""),
    issuerName: jspb.Message.getFieldWithDefault(msg, 12, ""),
    settlementCurrency: (f = msg.getSettlementCurrency()) && proto.fintekkers.models.security.SecurityProto.toObject(includeInstance, f),
    quantityType: jspb.Message.getFieldWithDefault(msg, 14, 0),
    identifier: (f = msg.getIdentifier()) && fintekkers_models_security_identifier_identifier_pb.IdentifierProto.toObject(includeInstance, f),
    description: jspb.Message.getFieldWithDefault(msg, 41, ""),
    cashId: jspb.Message.getFieldWithDefault(msg, 50, ""),
    couponRate: (f = msg.getCouponRate()) && fintekkers_models_util_decimal_value_pb.DecimalValueProto.toObject(includeInstance, f),
    couponType: jspb.Message.getFieldWithDefault(msg, 61, 0),
    couponFrequency: jspb.Message.getFieldWithDefault(msg, 62, 0),
    datedDate: (f = msg.getDatedDate()) && fintekkers_models_util_local_date_pb.LocalDateProto.toObject(includeInstance, f),
    faceValue: (f = msg.getFaceValue()) && fintekkers_models_util_decimal_value_pb.DecimalValueProto.toObject(includeInstance, f),
    issueDate: (f = msg.getIssueDate()) && fintekkers_models_util_local_date_pb.LocalDateProto.toObject(includeInstance, f),
    maturityDate: (f = msg.getMaturityDate()) && fintekkers_models_util_local_date_pb.LocalDateProto.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fintekkers.models.security.SecurityProto}
 */
proto.fintekkers.models.security.SecurityProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.models.security.SecurityProto;
  return proto.fintekkers.models.security.SecurityProto.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.models.security.SecurityProto} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.models.security.SecurityProto}
 */
proto.fintekkers.models.security.SecurityProto.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setObjectClass(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    case 5:
      var value = new fintekkers_models_util_uuid_pb.UUIDProto;
      reader.readMessage(value,fintekkers_models_util_uuid_pb.UUIDProto.deserializeBinaryFromReader);
      msg.setUuid(value);
      break;
    case 6:
      var value = new fintekkers_models_util_local_timestamp_pb.LocalTimestampProto;
      reader.readMessage(value,fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.deserializeBinaryFromReader);
      msg.setAsOf(value);
      break;
    case 7:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsLink(value);
      break;
    case 10:
      var value = /** @type {!proto.fintekkers.models.security.SecurityTypeProto} */ (reader.readEnum());
      msg.setSecurityType(value);
      break;
    case 11:
      var value = /** @type {string} */ (reader.readString());
      msg.setAssetClass(value);
      break;
    case 12:
      var value = /** @type {string} */ (reader.readString());
      msg.setIssuerName(value);
      break;
    case 13:
      var value = new proto.fintekkers.models.security.SecurityProto;
      reader.readMessage(value,proto.fintekkers.models.security.SecurityProto.deserializeBinaryFromReader);
      msg.setSettlementCurrency(value);
      break;
    case 14:
      var value = /** @type {!proto.fintekkers.models.security.SecurityQuantityTypeProto} */ (reader.readEnum());
      msg.setQuantityType(value);
      break;
    case 40:
      var value = new fintekkers_models_security_identifier_identifier_pb.IdentifierProto;
      reader.readMessage(value,fintekkers_models_security_identifier_identifier_pb.IdentifierProto.deserializeBinaryFromReader);
      msg.setIdentifier(value);
      break;
    case 41:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 50:
      var value = /** @type {string} */ (reader.readString());
      msg.setCashId(value);
      break;
    case 60:
      var value = new fintekkers_models_util_decimal_value_pb.DecimalValueProto;
      reader.readMessage(value,fintekkers_models_util_decimal_value_pb.DecimalValueProto.deserializeBinaryFromReader);
      msg.setCouponRate(value);
      break;
    case 61:
      var value = /** @type {!proto.fintekkers.models.security.CouponTypeProto} */ (reader.readEnum());
      msg.setCouponType(value);
      break;
    case 62:
      var value = /** @type {!proto.fintekkers.models.security.CouponFrequencyProto} */ (reader.readEnum());
      msg.setCouponFrequency(value);
      break;
    case 63:
      var value = new fintekkers_models_util_local_date_pb.LocalDateProto;
      reader.readMessage(value,fintekkers_models_util_local_date_pb.LocalDateProto.deserializeBinaryFromReader);
      msg.setDatedDate(value);
      break;
    case 64:
      var value = new fintekkers_models_util_decimal_value_pb.DecimalValueProto;
      reader.readMessage(value,fintekkers_models_util_decimal_value_pb.DecimalValueProto.deserializeBinaryFromReader);
      msg.setFaceValue(value);
      break;
    case 65:
      var value = new fintekkers_models_util_local_date_pb.LocalDateProto;
      reader.readMessage(value,fintekkers_models_util_local_date_pb.LocalDateProto.deserializeBinaryFromReader);
      msg.setIssueDate(value);
      break;
    case 66:
      var value = new fintekkers_models_util_local_date_pb.LocalDateProto;
      reader.readMessage(value,fintekkers_models_util_local_date_pb.LocalDateProto.deserializeBinaryFromReader);
      msg.setMaturityDate(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fintekkers.models.security.SecurityProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.models.security.SecurityProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.models.security.SecurityProto} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.security.SecurityProto.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getObjectClass();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getUuid();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      fintekkers_models_util_uuid_pb.UUIDProto.serializeBinaryToWriter
    );
  }
  f = message.getAsOf();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.serializeBinaryToWriter
    );
  }
  f = message.getIsLink();
  if (f) {
    writer.writeBool(
      7,
      f
    );
  }
  f = message.getSecurityType();
  if (f !== 0.0) {
    writer.writeEnum(
      10,
      f
    );
  }
  f = message.getAssetClass();
  if (f.length > 0) {
    writer.writeString(
      11,
      f
    );
  }
  f = message.getIssuerName();
  if (f.length > 0) {
    writer.writeString(
      12,
      f
    );
  }
  f = message.getSettlementCurrency();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      proto.fintekkers.models.security.SecurityProto.serializeBinaryToWriter
    );
  }
  f = message.getQuantityType();
  if (f !== 0.0) {
    writer.writeEnum(
      14,
      f
    );
  }
  f = message.getIdentifier();
  if (f != null) {
    writer.writeMessage(
      40,
      f,
      fintekkers_models_security_identifier_identifier_pb.IdentifierProto.serializeBinaryToWriter
    );
  }
  f = message.getDescription();
  if (f.length > 0) {
    writer.writeString(
      41,
      f
    );
  }
  f = message.getCashId();
  if (f.length > 0) {
    writer.writeString(
      50,
      f
    );
  }
  f = message.getCouponRate();
  if (f != null) {
    writer.writeMessage(
      60,
      f,
      fintekkers_models_util_decimal_value_pb.DecimalValueProto.serializeBinaryToWriter
    );
  }
  f = message.getCouponType();
  if (f !== 0.0) {
    writer.writeEnum(
      61,
      f
    );
  }
  f = message.getCouponFrequency();
  if (f !== 0.0) {
    writer.writeEnum(
      62,
      f
    );
  }
  f = message.getDatedDate();
  if (f != null) {
    writer.writeMessage(
      63,
      f,
      fintekkers_models_util_local_date_pb.LocalDateProto.serializeBinaryToWriter
    );
  }
  f = message.getFaceValue();
  if (f != null) {
    writer.writeMessage(
      64,
      f,
      fintekkers_models_util_decimal_value_pb.DecimalValueProto.serializeBinaryToWriter
    );
  }
  f = message.getIssueDate();
  if (f != null) {
    writer.writeMessage(
      65,
      f,
      fintekkers_models_util_local_date_pb.LocalDateProto.serializeBinaryToWriter
    );
  }
  f = message.getMaturityDate();
  if (f != null) {
    writer.writeMessage(
      66,
      f,
      fintekkers_models_util_local_date_pb.LocalDateProto.serializeBinaryToWriter
    );
  }
};


/**
 * optional string object_class = 1;
 * @return {string}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getObjectClass = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string version = 2;
 * @return {string}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional fintekkers.models.util.UUIDProto uuid = 5;
 * @return {?proto.fintekkers.models.util.UUIDProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getUuid = function() {
  return /** @type{?proto.fintekkers.models.util.UUIDProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_uuid_pb.UUIDProto, 5));
};


/**
 * @param {?proto.fintekkers.models.util.UUIDProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setUuid = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearUuid = function() {
  return this.setUuid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasUuid = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional fintekkers.models.util.LocalTimestampProto as_of = 6;
 * @return {?proto.fintekkers.models.util.LocalTimestampProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getAsOf = function() {
  return /** @type{?proto.fintekkers.models.util.LocalTimestampProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_timestamp_pb.LocalTimestampProto, 6));
};


/**
 * @param {?proto.fintekkers.models.util.LocalTimestampProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setAsOf = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearAsOf = function() {
  return this.setAsOf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasAsOf = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional bool is_link = 7;
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getIsLink = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 7, false));
};


/**
 * @param {boolean} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setIsLink = function(value) {
  return jspb.Message.setProto3BooleanField(this, 7, value);
};


/**
 * optional SecurityTypeProto security_type = 10;
 * @return {!proto.fintekkers.models.security.SecurityTypeProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getSecurityType = function() {
  return /** @type {!proto.fintekkers.models.security.SecurityTypeProto} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/**
 * @param {!proto.fintekkers.models.security.SecurityTypeProto} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setSecurityType = function(value) {
  return jspb.Message.setProto3EnumField(this, 10, value);
};


/**
 * optional string asset_class = 11;
 * @return {string}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getAssetClass = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 11, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setAssetClass = function(value) {
  return jspb.Message.setProto3StringField(this, 11, value);
};


/**
 * optional string issuer_name = 12;
 * @return {string}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getIssuerName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 12, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setIssuerName = function(value) {
  return jspb.Message.setProto3StringField(this, 12, value);
};


/**
 * optional SecurityProto settlement_currency = 13;
 * @return {?proto.fintekkers.models.security.SecurityProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getSettlementCurrency = function() {
  return /** @type{?proto.fintekkers.models.security.SecurityProto} */ (
    jspb.Message.getWrapperField(this, proto.fintekkers.models.security.SecurityProto, 13));
};


/**
 * @param {?proto.fintekkers.models.security.SecurityProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setSettlementCurrency = function(value) {
  return jspb.Message.setWrapperField(this, 13, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearSettlementCurrency = function() {
  return this.setSettlementCurrency(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasSettlementCurrency = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional SecurityQuantityTypeProto quantity_type = 14;
 * @return {!proto.fintekkers.models.security.SecurityQuantityTypeProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getQuantityType = function() {
  return /** @type {!proto.fintekkers.models.security.SecurityQuantityTypeProto} */ (jspb.Message.getFieldWithDefault(this, 14, 0));
};


/**
 * @param {!proto.fintekkers.models.security.SecurityQuantityTypeProto} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setQuantityType = function(value) {
  return jspb.Message.setProto3EnumField(this, 14, value);
};


/**
 * optional IdentifierProto identifier = 40;
 * @return {?proto.fintekkers.models.security.IdentifierProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getIdentifier = function() {
  return /** @type{?proto.fintekkers.models.security.IdentifierProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_security_identifier_identifier_pb.IdentifierProto, 40));
};


/**
 * @param {?proto.fintekkers.models.security.IdentifierProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setIdentifier = function(value) {
  return jspb.Message.setWrapperField(this, 40, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearIdentifier = function() {
  return this.setIdentifier(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasIdentifier = function() {
  return jspb.Message.getField(this, 40) != null;
};


/**
 * optional string description = 41;
 * @return {string}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 41, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 41, value);
};


/**
 * optional string cash_id = 50;
 * @return {string}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getCashId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 50, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setCashId = function(value) {
  return jspb.Message.setProto3StringField(this, 50, value);
};


/**
 * optional fintekkers.models.util.DecimalValueProto coupon_rate = 60;
 * @return {?proto.fintekkers.models.util.DecimalValueProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getCouponRate = function() {
  return /** @type{?proto.fintekkers.models.util.DecimalValueProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_decimal_value_pb.DecimalValueProto, 60));
};


/**
 * @param {?proto.fintekkers.models.util.DecimalValueProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setCouponRate = function(value) {
  return jspb.Message.setWrapperField(this, 60, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearCouponRate = function() {
  return this.setCouponRate(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasCouponRate = function() {
  return jspb.Message.getField(this, 60) != null;
};


/**
 * optional CouponTypeProto coupon_type = 61;
 * @return {!proto.fintekkers.models.security.CouponTypeProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getCouponType = function() {
  return /** @type {!proto.fintekkers.models.security.CouponTypeProto} */ (jspb.Message.getFieldWithDefault(this, 61, 0));
};


/**
 * @param {!proto.fintekkers.models.security.CouponTypeProto} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setCouponType = function(value) {
  return jspb.Message.setProto3EnumField(this, 61, value);
};


/**
 * optional CouponFrequencyProto coupon_frequency = 62;
 * @return {!proto.fintekkers.models.security.CouponFrequencyProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getCouponFrequency = function() {
  return /** @type {!proto.fintekkers.models.security.CouponFrequencyProto} */ (jspb.Message.getFieldWithDefault(this, 62, 0));
};


/**
 * @param {!proto.fintekkers.models.security.CouponFrequencyProto} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.setCouponFrequency = function(value) {
  return jspb.Message.setProto3EnumField(this, 62, value);
};


/**
 * optional fintekkers.models.util.LocalDateProto dated_date = 63;
 * @return {?proto.fintekkers.models.util.LocalDateProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getDatedDate = function() {
  return /** @type{?proto.fintekkers.models.util.LocalDateProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_date_pb.LocalDateProto, 63));
};


/**
 * @param {?proto.fintekkers.models.util.LocalDateProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setDatedDate = function(value) {
  return jspb.Message.setWrapperField(this, 63, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearDatedDate = function() {
  return this.setDatedDate(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasDatedDate = function() {
  return jspb.Message.getField(this, 63) != null;
};


/**
 * optional fintekkers.models.util.DecimalValueProto face_value = 64;
 * @return {?proto.fintekkers.models.util.DecimalValueProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getFaceValue = function() {
  return /** @type{?proto.fintekkers.models.util.DecimalValueProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_decimal_value_pb.DecimalValueProto, 64));
};


/**
 * @param {?proto.fintekkers.models.util.DecimalValueProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setFaceValue = function(value) {
  return jspb.Message.setWrapperField(this, 64, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearFaceValue = function() {
  return this.setFaceValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasFaceValue = function() {
  return jspb.Message.getField(this, 64) != null;
};


/**
 * optional fintekkers.models.util.LocalDateProto issue_date = 65;
 * @return {?proto.fintekkers.models.util.LocalDateProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getIssueDate = function() {
  return /** @type{?proto.fintekkers.models.util.LocalDateProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_date_pb.LocalDateProto, 65));
};


/**
 * @param {?proto.fintekkers.models.util.LocalDateProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setIssueDate = function(value) {
  return jspb.Message.setWrapperField(this, 65, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearIssueDate = function() {
  return this.setIssueDate(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasIssueDate = function() {
  return jspb.Message.getField(this, 65) != null;
};


/**
 * optional fintekkers.models.util.LocalDateProto maturity_date = 66;
 * @return {?proto.fintekkers.models.util.LocalDateProto}
 */
proto.fintekkers.models.security.SecurityProto.prototype.getMaturityDate = function() {
  return /** @type{?proto.fintekkers.models.util.LocalDateProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_date_pb.LocalDateProto, 66));
};


/**
 * @param {?proto.fintekkers.models.util.LocalDateProto|undefined} value
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
*/
proto.fintekkers.models.security.SecurityProto.prototype.setMaturityDate = function(value) {
  return jspb.Message.setWrapperField(this, 66, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.security.SecurityProto} returns this
 */
proto.fintekkers.models.security.SecurityProto.prototype.clearMaturityDate = function() {
  return this.setMaturityDate(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.security.SecurityProto.prototype.hasMaturityDate = function() {
  return jspb.Message.getField(this, 66) != null;
};


goog.object.extend(exports, proto.fintekkers.models.security);
