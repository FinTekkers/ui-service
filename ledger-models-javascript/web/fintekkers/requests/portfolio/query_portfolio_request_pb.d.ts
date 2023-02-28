import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';
import * as fintekkers_models_position_position_filter_pb from '../../../fintekkers/models/position/position_filter_pb';


export class QueryPortfolioRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QueryPortfolioRequestProto;

  getVersion(): string;
  setVersion(value: string): QueryPortfolioRequestProto;

  getUuidsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
  setUuidsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): QueryPortfolioRequestProto;
  clearUuidsList(): QueryPortfolioRequestProto;
  addUuids(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;

  getSearchPortfolioInput(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
  setSearchPortfolioInput(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QueryPortfolioRequestProto;
  hasSearchPortfolioInput(): boolean;
  clearSearchPortfolioInput(): QueryPortfolioRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryPortfolioRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: QueryPortfolioRequestProto): QueryPortfolioRequestProto.AsObject;
  static serializeBinaryToWriter(message: QueryPortfolioRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryPortfolioRequestProto;
  static deserializeBinaryFromReader(message: QueryPortfolioRequestProto, reader: jspb.BinaryReader): QueryPortfolioRequestProto;
}

export namespace QueryPortfolioRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuidsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
    searchPortfolioInput?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
  }
}

