import * as jspb from "google-protobuf";

import * as fintekkers_models_security_security_pb from "../../models/security/security_pb";

export class CreateSecurityRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): CreateSecurityRequestProto;

  getVersion(): string;
  setVersion(value: string): CreateSecurityRequestProto;

  getSecurityInput():
    | fintekkers_models_security_security_pb.SecurityProto
    | undefined;
  setSecurityInput(
    value?: fintekkers_models_security_security_pb.SecurityProto
  ): CreateSecurityRequestProto;
  hasSecurityInput(): boolean;
  clearSecurityInput(): CreateSecurityRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateSecurityRequestProto.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CreateSecurityRequestProto
  ): CreateSecurityRequestProto.AsObject;
  static serializeBinaryToWriter(
    message: CreateSecurityRequestProto,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): CreateSecurityRequestProto;
  static deserializeBinaryFromReader(
    message: CreateSecurityRequestProto,
    reader: jspb.BinaryReader
  ): CreateSecurityRequestProto;
}

export namespace CreateSecurityRequestProto {
  export type AsObject = {
    objectClass: string;
    version: string;
    securityInput?: fintekkers_models_security_security_pb.SecurityProto.AsObject;
  };
}
