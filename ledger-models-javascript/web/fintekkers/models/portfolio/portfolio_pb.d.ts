import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_local_timestamp_pb from '../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';


export class PortfolioProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): PortfolioProto;

  getVersion(): string;
  setVersion(value: string): PortfolioProto;

  getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
  setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): PortfolioProto;
  hasUuid(): boolean;
  clearUuid(): PortfolioProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PortfolioProto;
  hasAsOf(): boolean;
  clearAsOf(): PortfolioProto;

  getIsLink(): boolean;
  setIsLink(value: boolean): PortfolioProto;

  getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PortfolioProto;
  hasValidFrom(): boolean;
  clearValidFrom(): PortfolioProto;

  getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PortfolioProto;
  hasValidTo(): boolean;
  clearValidTo(): PortfolioProto;

  getPortfolioName(): string;
  setPortfolioName(value: string): PortfolioProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PortfolioProto.AsObject;
  static toObject(includeInstance: boolean, msg: PortfolioProto): PortfolioProto.AsObject;
  static serializeBinaryToWriter(message: PortfolioProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PortfolioProto;
  static deserializeBinaryFromReader(message: PortfolioProto, reader: jspb.BinaryReader): PortfolioProto;
}

export namespace PortfolioProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    isLink: boolean,
    validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    portfolioName: string,
  }
}

