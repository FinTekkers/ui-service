import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_decimal_value_pb from '../../../fintekkers/models/util/decimal_value_pb';
import * as fintekkers_models_util_local_timestamp_pb from '../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';
import * as fintekkers_models_security_security_pb from '../../../fintekkers/models/security/security_pb';


export class PriceProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): PriceProto;

  getVersion(): string;
  setVersion(value: string): PriceProto;

  getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
  setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): PriceProto;
  hasUuid(): boolean;
  clearUuid(): PriceProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PriceProto;
  hasAsOf(): boolean;
  clearAsOf(): PriceProto;

  getIsLink(): boolean;
  setIsLink(value: boolean): PriceProto;

  getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PriceProto;
  hasValidFrom(): boolean;
  clearValidFrom(): PriceProto;

  getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PriceProto;
  hasValidTo(): boolean;
  clearValidTo(): PriceProto;

  getPrice(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
  setPrice(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): PriceProto;
  hasPrice(): boolean;
  clearPrice(): PriceProto;

  getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
  setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): PriceProto;
  hasSecurity(): boolean;
  clearSecurity(): PriceProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PriceProto.AsObject;
  static toObject(includeInstance: boolean, msg: PriceProto): PriceProto.AsObject;
  static serializeBinaryToWriter(message: PriceProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PriceProto;
  static deserializeBinaryFromReader(message: PriceProto, reader: jspb.BinaryReader): PriceProto;
}

export namespace PriceProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    isLink: boolean,
    validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    price?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
  }
}

