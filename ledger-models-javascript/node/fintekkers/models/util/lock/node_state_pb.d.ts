// package: fintekkers.models.util.lock
// file: fintekkers/models/util/lock/node_state.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_local_timestamp_pb from "../../../../fintekkers/models/util/local_timestamp_pb";

export class NodeStateProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): NodeStateProto;
    getVersion(): string;
    setVersion(value: string): NodeStateProto;
    getPartition(): string;
    setPartition(value: string): NodeStateProto;
    getEndPoint(): string;
    setEndPoint(value: string): NodeStateProto;

    hasLastSeen(): boolean;
    clearLastSeen(): void;
    getLastSeen(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setLastSeen(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): NodeStateProto;
    getIsExpired(): boolean;
    setIsExpired(value: boolean): NodeStateProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NodeStateProto.AsObject;
    static toObject(includeInstance: boolean, msg: NodeStateProto): NodeStateProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NodeStateProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NodeStateProto;
    static deserializeBinaryFromReader(message: NodeStateProto, reader: jspb.BinaryReader): NodeStateProto;
}

export namespace NodeStateProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        partition: string,
        endPoint: string,
        lastSeen?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isExpired: boolean,
    }
}
