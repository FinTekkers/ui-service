import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';
import * as fintekkers_models_util_local_timestamp_pb from '../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_models_position_position_filter_pb from '../../../fintekkers/models/position/position_filter_pb';


export class QuerySecurityRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QuerySecurityRequestProto;

  getVersion(): string;
  setVersion(value: string): QuerySecurityRequestProto;

  getUuidsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
  setUuidsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): QuerySecurityRequestProto;
  clearUuidsList(): QuerySecurityRequestProto;
  addUuids(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;

  getSearchSecurityInput(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
  setSearchSecurityInput(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QuerySecurityRequestProto;
  hasSearchSecurityInput(): boolean;
  clearSearchSecurityInput(): QuerySecurityRequestProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): QuerySecurityRequestProto;
  hasAsOf(): boolean;
  clearAsOf(): QuerySecurityRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QuerySecurityRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: QuerySecurityRequestProto): QuerySecurityRequestProto.AsObject;
  static serializeBinaryToWriter(message: QuerySecurityRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QuerySecurityRequestProto;
  static deserializeBinaryFromReader(message: QuerySecurityRequestProto, reader: jspb.BinaryReader): QuerySecurityRequestProto;
}

export namespace QuerySecurityRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuidsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
    searchSecurityInput?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
  }
}

