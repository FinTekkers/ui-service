import * as jspb from "google-protobuf";

import * as fintekkers_models_position_position_util_pb from "./position_util_pb";

export class PositionFilterProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): PositionFilterProto;

  getVersion(): string;
  setVersion(value: string): PositionFilterProto;

  getFiltersList(): Array<fintekkers_models_position_position_util_pb.FieldMapEntry>;
  setFiltersList(
    value: Array<fintekkers_models_position_position_util_pb.FieldMapEntry>
  ): PositionFilterProto;
  clearFiltersList(): PositionFilterProto;
  addFilters(
    value?: fintekkers_models_position_position_util_pb.FieldMapEntry,
    index?: number
  ): fintekkers_models_position_position_util_pb.FieldMapEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PositionFilterProto.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PositionFilterProto
  ): PositionFilterProto.AsObject;
  static serializeBinaryToWriter(
    message: PositionFilterProto,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PositionFilterProto;
  static deserializeBinaryFromReader(
    message: PositionFilterProto,
    reader: jspb.BinaryReader
  ): PositionFilterProto;
}

export namespace PositionFilterProto {
  export type AsObject = {
    objectClass: string;
    version: string;
    filtersList: Array<fintekkers_models_position_position_util_pb.FieldMapEntry.AsObject>;
  };
}
