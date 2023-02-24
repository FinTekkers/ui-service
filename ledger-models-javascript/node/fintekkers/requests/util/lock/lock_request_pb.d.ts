// package: fintekkers.requests.util.lock
// file: fintekkers/requests/util/lock/lock_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_lock_node_state_pb from "../../../../fintekkers/models/util/lock/node_state_pb";
import * as fintekkers_requests_util_operation_pb from "../../../../fintekkers/requests/util/operation_pb";

export class LockRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): LockRequestProto;
    getVersion(): string;
    setVersion(value: string): LockRequestProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): LockRequestProto;

    hasNodeState(): boolean;
    clearNodeState(): void;
    getNodeState(): fintekkers_models_util_lock_node_state_pb.NodeStateProto | undefined;
    setNodeState(value?: fintekkers_models_util_lock_node_state_pb.NodeStateProto): LockRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: LockRequestProto): LockRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockRequestProto;
    static deserializeBinaryFromReader(message: LockRequestProto, reader: jspb.BinaryReader): LockRequestProto;
}

export namespace LockRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        nodeState?: fintekkers_models_util_lock_node_state_pb.NodeStateProto.AsObject,
    }
}
