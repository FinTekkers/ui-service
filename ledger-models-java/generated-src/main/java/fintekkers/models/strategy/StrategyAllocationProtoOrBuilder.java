// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/models/strategy/strategy_allocation.proto

package fintekkers.models.strategy;

public interface StrategyAllocationProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.models.strategy.StrategyAllocationProto)
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
   * <pre>
   *Map
   * </pre>
   *
   * <code>repeated .fintekkers.models.strategy.MapFieldEntry allocations = 10;</code>
   */
  java.util.List<fintekkers.models.strategy.MapFieldEntry> 
      getAllocationsList();
  /**
   * <pre>
   *Map
   * </pre>
   *
   * <code>repeated .fintekkers.models.strategy.MapFieldEntry allocations = 10;</code>
   */
  fintekkers.models.strategy.MapFieldEntry getAllocations(int index);
  /**
   * <pre>
   *Map
   * </pre>
   *
   * <code>repeated .fintekkers.models.strategy.MapFieldEntry allocations = 10;</code>
   */
  int getAllocationsCount();
  /**
   * <pre>
   *Map
   * </pre>
   *
   * <code>repeated .fintekkers.models.strategy.MapFieldEntry allocations = 10;</code>
   */
  java.util.List<? extends fintekkers.models.strategy.MapFieldEntryOrBuilder> 
      getAllocationsOrBuilderList();
  /**
   * <pre>
   *Map
   * </pre>
   *
   * <code>repeated .fintekkers.models.strategy.MapFieldEntry allocations = 10;</code>
   */
  fintekkers.models.strategy.MapFieldEntryOrBuilder getAllocationsOrBuilder(
      int index);
}
