// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/models/security/security.proto

package fintekkers.models.security;

public interface SecurityProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.models.security.SecurityProto)
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
   * <code>.fintekkers.models.util.UUIDProto uuid = 5;</code>
   * @return Whether the uuid field is set.
   */
  boolean hasUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.fintekkers.models.util.UUIDProto uuid = 5;</code>
   * @return The uuid.
   */
  fintekkers.models.util.Uuid.UUIDProto getUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.fintekkers.models.util.UUIDProto uuid = 5;</code>
   */
  fintekkers.models.util.Uuid.UUIDProtoOrBuilder getUuidOrBuilder();

  /**
   * <code>.fintekkers.models.util.LocalTimestampProto as_of = 6;</code>
   * @return Whether the asOf field is set.
   */
  boolean hasAsOf();
  /**
   * <code>.fintekkers.models.util.LocalTimestampProto as_of = 6;</code>
   * @return The asOf.
   */
  fintekkers.models.util.LocalTimestamp.LocalTimestampProto getAsOf();
  /**
   * <code>.fintekkers.models.util.LocalTimestampProto as_of = 6;</code>
   */
  fintekkers.models.util.LocalTimestamp.LocalTimestampProtoOrBuilder getAsOfOrBuilder();

  /**
   * <code>bool is_link = 7;</code>
   * @return The isLink.
   */
  boolean getIsLink();

  /**
   * <code>.fintekkers.models.security.SecurityTypeProto security_type = 10;</code>
   * @return The enum numeric value on the wire for securityType.
   */
  int getSecurityTypeValue();
  /**
   * <code>.fintekkers.models.security.SecurityTypeProto security_type = 10;</code>
   * @return The securityType.
   */
  fintekkers.models.security.SecurityTypeProto getSecurityType();

  /**
   * <pre>
   *Biz fields
   * </pre>
   *
   * <code>string asset_class = 11;</code>
   * @return The assetClass.
   */
  java.lang.String getAssetClass();
  /**
   * <pre>
   *Biz fields
   * </pre>
   *
   * <code>string asset_class = 11;</code>
   * @return The bytes for assetClass.
   */
  com.google.protobuf.ByteString
      getAssetClassBytes();

  /**
   * <code>string issuer_name = 12;</code>
   * @return The issuerName.
   */
  java.lang.String getIssuerName();
  /**
   * <code>string issuer_name = 12;</code>
   * @return The bytes for issuerName.
   */
  com.google.protobuf.ByteString
      getIssuerNameBytes();

  /**
   * <code>.fintekkers.models.security.SecurityProto settlement_currency = 13;</code>
   * @return Whether the settlementCurrency field is set.
   */
  boolean hasSettlementCurrency();
  /**
   * <code>.fintekkers.models.security.SecurityProto settlement_currency = 13;</code>
   * @return The settlementCurrency.
   */
  fintekkers.models.security.SecurityProto getSettlementCurrency();
  /**
   * <code>.fintekkers.models.security.SecurityProto settlement_currency = 13;</code>
   */
  fintekkers.models.security.SecurityProtoOrBuilder getSettlementCurrencyOrBuilder();

  /**
   * <code>.fintekkers.models.security.SecurityQuantityTypeProto quantity_type = 14;</code>
   * @return The enum numeric value on the wire for quantityType.
   */
  int getQuantityTypeValue();
  /**
   * <code>.fintekkers.models.security.SecurityQuantityTypeProto quantity_type = 14;</code>
   * @return The quantityType.
   */
  fintekkers.models.security.SecurityQuantityTypeProto getQuantityType();

  /**
   * <code>.fintekkers.models.security.IdentifierProto identifier = 40;</code>
   * @return Whether the identifier field is set.
   */
  boolean hasIdentifier();
  /**
   * <code>.fintekkers.models.security.IdentifierProto identifier = 40;</code>
   * @return The identifier.
   */
  fintekkers.models.security.IdentifierProto getIdentifier();
  /**
   * <code>.fintekkers.models.security.IdentifierProto identifier = 40;</code>
   */
  fintekkers.models.security.IdentifierProtoOrBuilder getIdentifierOrBuilder();

  /**
   * <code>string description = 41;</code>
   * @return The description.
   */
  java.lang.String getDescription();
  /**
   * <code>string description = 41;</code>
   * @return The bytes for description.
   */
  com.google.protobuf.ByteString
      getDescriptionBytes();

  /**
   * <pre>
   *Cash Security fields
   * </pre>
   *
   * <code>string cash_id = 50;</code>
   * @return The cashId.
   */
  java.lang.String getCashId();
  /**
   * <pre>
   *Cash Security fields
   * </pre>
   *
   * <code>string cash_id = 50;</code>
   * @return The bytes for cashId.
   */
  com.google.protobuf.ByteString
      getCashIdBytes();

  /**
   * <pre>
   *Bond Security fields
   * </pre>
   *
   * <code>.fintekkers.models.util.DecimalValueProto coupon_rate = 60;</code>
   * @return Whether the couponRate field is set.
   */
  boolean hasCouponRate();
  /**
   * <pre>
   *Bond Security fields
   * </pre>
   *
   * <code>.fintekkers.models.util.DecimalValueProto coupon_rate = 60;</code>
   * @return The couponRate.
   */
  fintekkers.models.util.DecimalValue.DecimalValueProto getCouponRate();
  /**
   * <pre>
   *Bond Security fields
   * </pre>
   *
   * <code>.fintekkers.models.util.DecimalValueProto coupon_rate = 60;</code>
   */
  fintekkers.models.util.DecimalValue.DecimalValueProtoOrBuilder getCouponRateOrBuilder();

  /**
   * <code>.fintekkers.models.security.CouponTypeProto coupon_type = 61;</code>
   * @return The enum numeric value on the wire for couponType.
   */
  int getCouponTypeValue();
  /**
   * <code>.fintekkers.models.security.CouponTypeProto coupon_type = 61;</code>
   * @return The couponType.
   */
  fintekkers.models.security.CouponTypeProto getCouponType();

  /**
   * <code>.fintekkers.models.security.CouponFrequencyProto coupon_frequency = 62;</code>
   * @return The enum numeric value on the wire for couponFrequency.
   */
  int getCouponFrequencyValue();
  /**
   * <code>.fintekkers.models.security.CouponFrequencyProto coupon_frequency = 62;</code>
   * @return The couponFrequency.
   */
  fintekkers.models.security.CouponFrequencyProto getCouponFrequency();

  /**
   * <code>.fintekkers.models.util.LocalDateProto dated_date = 63;</code>
   * @return Whether the datedDate field is set.
   */
  boolean hasDatedDate();
  /**
   * <code>.fintekkers.models.util.LocalDateProto dated_date = 63;</code>
   * @return The datedDate.
   */
  fintekkers.models.util.LocalDate.LocalDateProto getDatedDate();
  /**
   * <code>.fintekkers.models.util.LocalDateProto dated_date = 63;</code>
   */
  fintekkers.models.util.LocalDate.LocalDateProtoOrBuilder getDatedDateOrBuilder();

  /**
   * <code>.fintekkers.models.util.DecimalValueProto face_value = 64;</code>
   * @return Whether the faceValue field is set.
   */
  boolean hasFaceValue();
  /**
   * <code>.fintekkers.models.util.DecimalValueProto face_value = 64;</code>
   * @return The faceValue.
   */
  fintekkers.models.util.DecimalValue.DecimalValueProto getFaceValue();
  /**
   * <code>.fintekkers.models.util.DecimalValueProto face_value = 64;</code>
   */
  fintekkers.models.util.DecimalValue.DecimalValueProtoOrBuilder getFaceValueOrBuilder();

  /**
   * <code>.fintekkers.models.util.LocalDateProto issue_date = 65;</code>
   * @return Whether the issueDate field is set.
   */
  boolean hasIssueDate();
  /**
   * <code>.fintekkers.models.util.LocalDateProto issue_date = 65;</code>
   * @return The issueDate.
   */
  fintekkers.models.util.LocalDate.LocalDateProto getIssueDate();
  /**
   * <code>.fintekkers.models.util.LocalDateProto issue_date = 65;</code>
   */
  fintekkers.models.util.LocalDate.LocalDateProtoOrBuilder getIssueDateOrBuilder();

  /**
   * <code>.fintekkers.models.util.LocalDateProto maturity_date = 66;</code>
   * @return Whether the maturityDate field is set.
   */
  boolean hasMaturityDate();
  /**
   * <code>.fintekkers.models.util.LocalDateProto maturity_date = 66;</code>
   * @return The maturityDate.
   */
  fintekkers.models.util.LocalDate.LocalDateProto getMaturityDate();
  /**
   * <code>.fintekkers.models.util.LocalDateProto maturity_date = 66;</code>
   */
  fintekkers.models.util.LocalDate.LocalDateProtoOrBuilder getMaturityDateOrBuilder();
}