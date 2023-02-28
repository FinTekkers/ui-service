import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';
import * as fintekkers_models_position_position_filter_pb from '../../../fintekkers/models/position/position_filter_pb';


export class QueryTransactionRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QueryTransactionRequestProto;

  getVersion(): string;
  setVersion(value: string): QueryTransactionRequestProto;

  getUuidsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
  setUuidsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): QueryTransactionRequestProto;
  clearUuidsList(): QueryTransactionRequestProto;
  addUuids(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;

  getSearchTransactionInput(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
  setSearchTransactionInput(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QueryTransactionRequestProto;
  hasSearchTransactionInput(): boolean;
  clearSearchTransactionInput(): QueryTransactionRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryTransactionRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: QueryTransactionRequestProto): QueryTransactionRequestProto.AsObject;
  static serializeBinaryToWriter(message: QueryTransactionRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryTransactionRequestProto;
  static deserializeBinaryFromReader(message: QueryTransactionRequestProto, reader: jspb.BinaryReader): QueryTransactionRequestProto;
}

export namespace QueryTransactionRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuidsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
    searchTransactionInput?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
  }
}

