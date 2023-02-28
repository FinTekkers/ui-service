// package: fintekkers.models.util
// file: fintekkers/models/util/uuid.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class UUIDProto extends jspb.Message { 
    getRawUuid(): Uint8Array | string;
    getRawUuid_asU8(): Uint8Array;
    getRawUuid_asB64(): string;
    setRawUuid(value: Uint8Array | string): UUIDProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UUIDProto.AsObject;
    static toObject(includeInstance: boolean, msg: UUIDProto): UUIDProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UUIDProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UUIDProto;
    static deserializeBinaryFromReader(message: UUIDProto, reader: jspb.BinaryReader): UUIDProto;
}

export namespace UUIDProto {
    export type AsObject = {
        rawUuid: Uint8Array | string,
    }
}
