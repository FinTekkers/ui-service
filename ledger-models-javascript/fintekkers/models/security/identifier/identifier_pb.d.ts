import * as jspb from 'google-protobuf'

import * as fintekkers_models_security_identifier_identifier_type_pb from '../../../../fintekkers/models/security/identifier/identifier_type_pb';


export class IdentifierProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): IdentifierProto;

  getVersion(): string;
  setVersion(value: string): IdentifierProto;

  getIdentifierValue(): string;
  setIdentifierValue(value: string): IdentifierProto;

  getIdentifierType(): fintekkers_models_security_identifier_identifier_type_pb.IdentifierTypeProto;
  setIdentifierType(value: fintekkers_models_security_identifier_identifier_type_pb.IdentifierTypeProto): IdentifierProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IdentifierProto.AsObject;
  static toObject(includeInstance: boolean, msg: IdentifierProto): IdentifierProto.AsObject;
  static serializeBinaryToWriter(message: IdentifierProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IdentifierProto;
  static deserializeBinaryFromReader(message: IdentifierProto, reader: jspb.BinaryReader): IdentifierProto;
}

export namespace IdentifierProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    identifierValue: string,
    identifierType: fintekkers_models_security_identifier_identifier_type_pb.IdentifierTypeProto,
  }
}

