// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/valuation/valuation_request.proto

package common.request;

public interface ValuationRequestProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:valuation.ValuationRequestProto)
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
   *Only supports GET, since there is no backing store, so CREATE isn't relevant. SEARCH isn't relevant either.
   *VALIDATE could be implemented later, e.g. if the caller wants to check their inputs are correct.
   * </pre>
   *
   * <code>.util.RequestOperationTypeProto operation_type = 10;</code>
   * @return The enum numeric value on the wire for operationType.
   */
  int getOperationTypeValue();
  /**
   * <pre>
   *Only supports GET, since there is no backing store, so CREATE isn't relevant. SEARCH isn't relevant either.
   *VALIDATE could be implemented later, e.g. if the caller wants to check their inputs are correct.
   * </pre>
   *
   * <code>.util.RequestOperationTypeProto operation_type = 10;</code>
   * @return The operationType.
   */
  util.Operation.RequestOperationTypeProto getOperationType();

  /**
   * <code>.security.SecurityProto security_input = 20;</code>
   * @return Whether the securityInput field is set.
   */
  boolean hasSecurityInput();
  /**
   * <code>.security.SecurityProto security_input = 20;</code>
   * @return The securityInput.
   */
  common.models.security.SecurityProto getSecurityInput();
  /**
   * <code>.security.SecurityProto security_input = 20;</code>
   */
  common.models.security.SecurityProtoOrBuilder getSecurityInputOrBuilder();

  /**
   * <code>.position.PositionFilterProto position_input = 21;</code>
   * @return Whether the positionInput field is set.
   */
  boolean hasPositionInput();
  /**
   * <code>.position.PositionFilterProto position_input = 21;</code>
   * @return The positionInput.
   */
  common.models.position.PositionFilterProto getPositionInput();
  /**
   * <code>.position.PositionFilterProto position_input = 21;</code>
   */
  common.models.position.PositionFilterProtoOrBuilder getPositionInputOrBuilder();

  /**
   * <code>.price.PriceProto price_input = 22;</code>
   * @return Whether the priceInput field is set.
   */
  boolean hasPriceInput();
  /**
   * <code>.price.PriceProto price_input = 22;</code>
   * @return The priceInput.
   */
  common.models.price.PriceProto getPriceInput();
  /**
   * <code>.price.PriceProto price_input = 22;</code>
   */
  common.models.price.PriceProtoOrBuilder getPriceInputOrBuilder();
}
