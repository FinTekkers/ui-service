import * as grpcWeb from 'grpc-web';

import * as fintekkers_requests_util_lock_lock_request_pb from '../../../fintekkers/requests/util/lock/lock_request_pb';
import * as fintekkers_requests_util_lock_lock_response_pb from '../../../fintekkers/requests/util/lock/lock_response_pb';


export class LockClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  claimLock(
    request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;

}

export class LockPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  claimLock(
    request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;

}

