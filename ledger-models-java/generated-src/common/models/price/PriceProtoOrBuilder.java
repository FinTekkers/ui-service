// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: models/price/price.proto

package common.models.price;

public interface PriceProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:price.PriceProto)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <code>string object_class = 1;</code>
   * @return The objectClass.
   */
  java.lang.String getObjectClass();
  /**
   * <code>string object_class = 1;</code>
   * @return The bytes for objectClass.
   */
  com.google.protobuf.ByteString
      getObjectClassBytes();

  /**
   * <code>string version = 2;</code>
   * @return The version.
   */
  java.lang.String getVersion();
  /**
   * <code>string version = 2;</code>
   * @return The bytes for version.
   */
  com.google.protobuf.ByteString
      getVersionBytes();

  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   * @return Whether the uuid field is set.
   */
  boolean hasUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   * @return The uuid.
   */
  common.models.protoUtils.Uuid.UUIDProto getUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   */
  common.models.protoUtils.Uuid.UUIDProtoOrBuilder getUuidOrBuilder();

  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   * @return Whether the asOf field is set.
   */
  boolean hasAsOf();
  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   * @return The asOf.
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProto getAsOf();
  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProtoOrBuilder getAsOfOrBuilder();

  /**
   * <code>bool is_link = 7;</code>
   * @return The isLink.
   */
  boolean getIsLink();

  /**
   * <code>.util.DecimalValueProto price = 10;</code>
   * @return Whether the price field is set.
   */
  boolean hasPrice();
  /**
   * <code>.util.DecimalValueProto price = 10;</code>
   * @return The price.
   */
  common.models.protoUtils.DecimalValue.DecimalValueProto getPrice();
  /**
   * <code>.util.DecimalValueProto price = 10;</code>
   */
  common.models.protoUtils.DecimalValue.DecimalValueProtoOrBuilder getPriceOrBuilder();

  /**
   * <code>.security.SecurityProto security = 11;</code>
   * @return Whether the security field is set.
   */
  boolean hasSecurity();
  /**
   * <code>.security.SecurityProto security = 11;</code>
   * @return The security.
   */
  common.models.security.SecurityProto getSecurity();
  /**
   * <code>.security.SecurityProto security = 11;</code>
   */
  common.models.security.SecurityProtoOrBuilder getSecurityOrBuilder();
}
