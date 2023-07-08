import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_local_timestamp_pb from '../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';


export class StrategyProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): StrategyProto;

  getVersion(): string;
  setVersion(value: string): StrategyProto;

  getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
  setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): StrategyProto;
  hasUuid(): boolean;
  clearUuid(): StrategyProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyProto;
  hasAsOf(): boolean;
  clearAsOf(): StrategyProto;

  getIsLink(): boolean;
  setIsLink(value: boolean): StrategyProto;

  getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyProto;
  hasValidFrom(): boolean;
  clearValidFrom(): StrategyProto;

  getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyProto;
  hasValidTo(): boolean;
  clearValidTo(): StrategyProto;

  getStrategyName(): string;
  setStrategyName(value: string): StrategyProto;

  getParent(): StrategyProto | undefined;
  setParent(value?: StrategyProto): StrategyProto;
  hasParent(): boolean;
  clearParent(): StrategyProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StrategyProto.AsObject;
  static toObject(includeInstance: boolean, msg: StrategyProto): StrategyProto.AsObject;
  static serializeBinaryToWriter(message: StrategyProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StrategyProto;
  static deserializeBinaryFromReader(message: StrategyProto, reader: jspb.BinaryReader): StrategyProto;
}

export namespace StrategyProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    isLink: boolean,
    validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    strategyName: string,
    parent?: StrategyProto.AsObject,
  }
}

