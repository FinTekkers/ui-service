import * as jspb from "google-protobuf";

import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as fintekkers_models_position_field_pb from "./field_pb";
import * as fintekkers_models_position_measure_pb from "./measure_pb";
import * as fintekkers_models_security_identifier_identifier_pb from "../security/identifier/identifier_pb";
import * as fintekkers_models_util_decimal_value_pb from "../util/decimal_value_pb";

export class MeasureMapEntry extends jspb.Message {
  getField(): fintekkers_models_position_measure_pb.MeasureProto;
  setField(
    value: fintekkers_models_position_measure_pb.MeasureProto
  ): MeasureMapEntry;

  getMeasureValue():
    | fintekkers_models_util_decimal_value_pb.DecimalValueProto
    | undefined;
  setMeasureValue(
    value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto
  ): MeasureMapEntry;
  hasMeasureValue(): boolean;
  clearMeasureValue(): MeasureMapEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MeasureMapEntry.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MeasureMapEntry
  ): MeasureMapEntry.AsObject;
  static serializeBinaryToWriter(
    message: MeasureMapEntry,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MeasureMapEntry;
  static deserializeBinaryFromReader(
    message: MeasureMapEntry,
    reader: jspb.BinaryReader
  ): MeasureMapEntry;
}

export namespace MeasureMapEntry {
  export type AsObject = {
    field: fintekkers_models_position_measure_pb.MeasureProto;
    measureValue?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject;
  };
}

export class FieldMapEntry extends jspb.Message {
  getField(): fintekkers_models_position_field_pb.FieldProto;
  setField(
    value: fintekkers_models_position_field_pb.FieldProto
  ): FieldMapEntry;

  getFieldValuePacked(): google_protobuf_any_pb.Any | undefined;
  setFieldValuePacked(value?: google_protobuf_any_pb.Any): FieldMapEntry;
  hasFieldValuePacked(): boolean;
  clearFieldValuePacked(): FieldMapEntry;

  getEnumValue(): number;
  setEnumValue(value: number): FieldMapEntry;

  getOperator(): PositionFilterOperator;
  setOperator(value: PositionFilterOperator): FieldMapEntry;

  getFieldmapvalueoneofCase(): FieldMapEntry.FieldmapvalueoneofCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FieldMapEntry.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FieldMapEntry
  ): FieldMapEntry.AsObject;
  static serializeBinaryToWriter(
    message: FieldMapEntry,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): FieldMapEntry;
  static deserializeBinaryFromReader(
    message: FieldMapEntry,
    reader: jspb.BinaryReader
  ): FieldMapEntry;
}

export namespace FieldMapEntry {
  export type AsObject = {
    field: fintekkers_models_position_field_pb.FieldProto;
    fieldValuePacked?: google_protobuf_any_pb.Any.AsObject;
    enumValue: number;
    operator: PositionFilterOperator;
  };

  export enum FieldmapvalueoneofCase {
    FIELDMAPVALUEONEOF_NOT_SET = 0,
    FIELD_VALUE_PACKED = 4,
    ENUM_VALUE = 5,
  }
}

export enum PositionFilterOperator {
  UNKNOWN_OPERATOR = 0,
  EQUALS = 1,
  NOT_EQUALS = 2,
  LESS_THAN = 3,
  LESS_THAN_OR_EQUALS = 4,
  MORE_THAN = 5,
  MORE_THAN_OR_EQUALS = 6,
}
