// package: fintekkers.requests.util.lock
// file: fintekkers/requests/util/lock/lock_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_lock_node_state_pb from "../../../../fintekkers/models/util/lock/node_state_pb";
import * as fintekkers_requests_util_lock_lock_request_pb from "../../../../fintekkers/requests/util/lock/lock_request_pb";

export class LockResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): LockResponseProto;
    getVersion(): string;
    setVersion(value: string): LockResponseProto;

    hasCreateLockRequest(): boolean;
    clearCreateLockRequest(): void;
    getCreateLockRequest(): fintekkers_requests_util_lock_lock_request_pb.LockRequestProto | undefined;
    setCreateLockRequest(value?: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto): LockResponseProto;

    hasLockResponse(): boolean;
    clearLockResponse(): void;
    getLockResponse(): fintekkers_models_util_lock_node_state_pb.NodeStateProto | undefined;
    setLockResponse(value?: fintekkers_models_util_lock_node_state_pb.NodeStateProto): LockResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: LockResponseProto): LockResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockResponseProto;
    static deserializeBinaryFromReader(message: LockResponseProto, reader: jspb.BinaryReader): LockResponseProto;
}

export namespace LockResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        createLockRequest?: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto.AsObject,
        lockResponse?: fintekkers_models_util_lock_node_state_pb.NodeStateProto.AsObject,
    }
}
