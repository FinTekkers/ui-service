// package: fintekkers.models.util
// file: fintekkers/models/util/local_date.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class LocalDateProto extends jspb.Message { 
    getYear(): number;
    setYear(value: number): LocalDateProto;
    getMonth(): number;
    setMonth(value: number): LocalDateProto;
    getDay(): number;
    setDay(value: number): LocalDateProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LocalDateProto.AsObject;
    static toObject(includeInstance: boolean, msg: LocalDateProto): LocalDateProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LocalDateProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LocalDateProto;
    static deserializeBinaryFromReader(message: LocalDateProto, reader: jspb.BinaryReader): LocalDateProto;
}

export namespace LocalDateProto {
    export type AsObject = {
        year: number,
        month: number,
        day: number,
    }
}
