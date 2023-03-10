// package: fintekkers.models.util
// file: fintekkers/models/util/endpoint.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Endpoint extends jspb.Message { 
    getIp(): string;
    setIp(value: string): Endpoint;
    getPort(): number;
    setPort(value: number): Endpoint;
    getFullyQualifiedUrl(): string;
    setFullyQualifiedUrl(value: string): Endpoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Endpoint.AsObject;
    static toObject(includeInstance: boolean, msg: Endpoint): Endpoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Endpoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Endpoint;
    static deserializeBinaryFromReader(message: Endpoint, reader: jspb.BinaryReader): Endpoint;
}

export namespace Endpoint {
    export type AsObject = {
        ip: string,
        port: number,
        fullyQualifiedUrl: string,
    }
}
