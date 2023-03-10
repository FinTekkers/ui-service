// package: fintekkers.services.lock_service
// file: fintekkers/services/lock-service/lock_service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as fintekkers_requests_util_lock_lock_request_pb from "../../../fintekkers/requests/util/lock/lock_request_pb";
import * as fintekkers_requests_util_lock_lock_response_pb from "../../../fintekkers/requests/util/lock/lock_response_pb";
import * as fintekkers_models_util_lock_node_partition_pb from "../../../fintekkers/models/util/lock/node_partition_pb";
import * as fintekkers_models_util_lock_node_state_pb from "../../../fintekkers/models/util/lock/node_state_pb";

export class NamespaceList extends jspb.Message { 
    clearNamespacesList(): void;
    getNamespacesList(): Array<string>;
    setNamespacesList(value: Array<string>): NamespaceList;
    addNamespaces(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NamespaceList.AsObject;
    static toObject(includeInstance: boolean, msg: NamespaceList): NamespaceList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NamespaceList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NamespaceList;
    static deserializeBinaryFromReader(message: NamespaceList, reader: jspb.BinaryReader): NamespaceList;
}

export namespace NamespaceList {
    export type AsObject = {
        namespacesList: Array<string>,
    }
}

export class PartitionsList extends jspb.Message { 
    clearNamespacesList(): void;
    getNamespacesList(): Array<fintekkers_models_util_lock_node_partition_pb.NodePartition>;
    setNamespacesList(value: Array<fintekkers_models_util_lock_node_partition_pb.NodePartition>): PartitionsList;
    addNamespaces(value?: fintekkers_models_util_lock_node_partition_pb.NodePartition, index?: number): fintekkers_models_util_lock_node_partition_pb.NodePartition;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PartitionsList.AsObject;
    static toObject(includeInstance: boolean, msg: PartitionsList): PartitionsList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PartitionsList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PartitionsList;
    static deserializeBinaryFromReader(message: PartitionsList, reader: jspb.BinaryReader): PartitionsList;
}

export namespace PartitionsList {
    export type AsObject = {
        namespacesList: Array<fintekkers_models_util_lock_node_partition_pb.NodePartition.AsObject>,
    }
}
