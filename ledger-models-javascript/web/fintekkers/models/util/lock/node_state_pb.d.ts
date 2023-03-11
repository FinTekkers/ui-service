import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_local_timestamp_pb from '../../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_models_util_endpoint_pb from '../../../../fintekkers/models/util/endpoint_pb';
import * as fintekkers_models_util_lock_node_partition_pb from '../../../../fintekkers/models/util/lock/node_partition_pb';


export class NodeState extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): NodeState;

  getVersion(): string;
  setVersion(value: string): NodeState;

  getPartition(): fintekkers_models_util_lock_node_partition_pb.NodePartition | undefined;
  setPartition(value?: fintekkers_models_util_lock_node_partition_pb.NodePartition): NodeState;
  hasPartition(): boolean;
  clearPartition(): NodeState;

  getEndPoint(): fintekkers_models_util_endpoint_pb.Endpoint | undefined;
  setEndPoint(value?: fintekkers_models_util_endpoint_pb.Endpoint): NodeState;
  hasEndPoint(): boolean;
  clearEndPoint(): NodeState;

  getLastSeen(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setLastSeen(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): NodeState;
  hasLastSeen(): boolean;
  clearLastSeen(): NodeState;

  getIsExpired(): boolean;
  setIsExpired(value: boolean): NodeState;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NodeState.AsObject;
  static toObject(includeInstance: boolean, msg: NodeState): NodeState.AsObject;
  static serializeBinaryToWriter(message: NodeState, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NodeState;
  static deserializeBinaryFromReader(message: NodeState, reader: jspb.BinaryReader): NodeState;
}

export namespace NodeState {
  export type AsObject = {
    objectClass: string,
    version: string,
    partition?: fintekkers_models_util_lock_node_partition_pb.NodePartition.AsObject,
    endPoint?: fintekkers_models_util_endpoint_pb.Endpoint.AsObject,
    lastSeen?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    isExpired: boolean,
  }
}

