import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_lock_node_state_pb from '../../../../fintekkers/models/util/lock/node_state_pb';
import * as fintekkers_requests_util_lock_lock_request_pb from '../../../../fintekkers/requests/util/lock/lock_request_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../../fintekkers/requests/util/errors/summary_pb';


export class LockResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): LockResponseProto;

  getVersion(): string;
  setVersion(value: string): LockResponseProto;

  getGetLockRequest(): fintekkers_requests_util_lock_lock_request_pb.LockRequestProto | undefined;
  setGetLockRequest(value?: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto): LockResponseProto;
  hasGetLockRequest(): boolean;
  clearGetLockRequest(): LockResponseProto;

  getLockResponse(): fintekkers_models_util_lock_node_state_pb.NodeState | undefined;
  setLockResponse(value?: fintekkers_models_util_lock_node_state_pb.NodeState): LockResponseProto;
  hasLockResponse(): boolean;
  clearLockResponse(): LockResponseProto;

  getErrorsOrWarnings(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
  setErrorsOrWarnings(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): LockResponseProto;
  hasErrorsOrWarnings(): boolean;
  clearErrorsOrWarnings(): LockResponseProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LockResponseProto.AsObject;
  static toObject(includeInstance: boolean, msg: LockResponseProto): LockResponseProto.AsObject;
  static serializeBinaryToWriter(message: LockResponseProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LockResponseProto;
  static deserializeBinaryFromReader(message: LockResponseProto, reader: jspb.BinaryReader): LockResponseProto;
}

export namespace LockResponseProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    getLockRequest?: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto.AsObject,
    lockResponse?: fintekkers_models_util_lock_node_state_pb.NodeState.AsObject,
    errorsOrWarnings?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
  }
}

