import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_lock_node_state_pb from '../../../../fintekkers/models/util/lock/node_state_pb';
import * as fintekkers_requests_util_operation_pb from '../../../../fintekkers/requests/util/operation_pb';


export class LockRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): LockRequestProto;

  getVersion(): string;
  setVersion(value: string): LockRequestProto;

  getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
  setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): LockRequestProto;

  getNodeState(): fintekkers_models_util_lock_node_state_pb.NodeStateProto | undefined;
  setNodeState(value?: fintekkers_models_util_lock_node_state_pb.NodeStateProto): LockRequestProto;
  hasNodeState(): boolean;
  clearNodeState(): LockRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LockRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: LockRequestProto): LockRequestProto.AsObject;
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

