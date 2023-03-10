// package: fintekkers.models.util.lock
// file: fintekkers/models/util/lock/node_partition.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class NodePartition extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): NodePartition;
    getVersion(): string;
    setVersion(value: string): NodePartition;
    getPartition(): number;
    setPartition(value: number): NodePartition;
    getNamespace(): string;
    setNamespace(value: string): NodePartition;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NodePartition.AsObject;
    static toObject(includeInstance: boolean, msg: NodePartition): NodePartition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NodePartition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NodePartition;
    static deserializeBinaryFromReader(message: NodePartition, reader: jspb.BinaryReader): NodePartition;
}

export namespace NodePartition {
    export type AsObject = {
        objectClass: string,
        version: string,
        partition: number,
        namespace: string,
    }
}
