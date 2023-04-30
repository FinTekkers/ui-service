import * as jspb from 'google-protobuf'

import * as fintekkers_models_position_position_util_pb from '../../../fintekkers/models/position/position_util_pb';


export class PositionProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): PositionProto;

  getVersion(): string;
  setVersion(value: string): PositionProto;

  getPositionView(): PositionViewProto;
  setPositionView(value: PositionViewProto): PositionProto;

  getPositionType(): PositionTypeProto;
  setPositionType(value: PositionTypeProto): PositionProto;

  getMeasuresList(): Array<fintekkers_models_position_position_util_pb.MeasureMapEntry>;
  setMeasuresList(value: Array<fintekkers_models_position_position_util_pb.MeasureMapEntry>): PositionProto;
  clearMeasuresList(): PositionProto;
  addMeasures(value?: fintekkers_models_position_position_util_pb.MeasureMapEntry, index?: number): fintekkers_models_position_position_util_pb.MeasureMapEntry;

  getFieldsList(): Array<fintekkers_models_position_position_util_pb.FieldMapEntry>;
  setFieldsList(value: Array<fintekkers_models_position_position_util_pb.FieldMapEntry>): PositionProto;
  clearFieldsList(): PositionProto;
  addFields(value?: fintekkers_models_position_position_util_pb.FieldMapEntry, index?: number): fintekkers_models_position_position_util_pb.FieldMapEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PositionProto.AsObject;
  static toObject(includeInstance: boolean, msg: PositionProto): PositionProto.AsObject;
  static serializeBinaryToWriter(message: PositionProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PositionProto;
  static deserializeBinaryFromReader(message: PositionProto, reader: jspb.BinaryReader): PositionProto;
}

export namespace PositionProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    positionView: PositionViewProto,
    positionType: PositionTypeProto,
    measuresList: Array<fintekkers_models_position_position_util_pb.MeasureMapEntry.AsObject>,
    fieldsList: Array<fintekkers_models_position_position_util_pb.FieldMapEntry.AsObject>,
  }
}

export enum PositionViewProto { 
  UNKNOWN_POSITION_VIEW = 0,
  DEFAULT_VIEW = 1,
  STRATEGY_VIEW = 2,
}
export enum PositionTypeProto { 
  UNKNOWN_POSITION_TYPE = 0,
  TRANSACTION = 1,
  TAX_LOT = 2,
}
