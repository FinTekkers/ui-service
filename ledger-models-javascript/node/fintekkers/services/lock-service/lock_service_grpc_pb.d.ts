// package: fintekkers.services.lock_service
// file: fintekkers/services/lock-service/lock_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_lock_service_lock_service_pb from "../../../fintekkers/services/lock-service/lock_service_pb";
import * as fintekkers_requests_util_lock_lock_request_pb from "../../../fintekkers/requests/util/lock/lock_request_pb";
import * as fintekkers_requests_util_lock_lock_response_pb from "../../../fintekkers/requests/util/lock/lock_response_pb";

interface ILockService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    claimLock: ILockService_IClaimLock;
}

interface ILockService_IClaimLock extends grpc.MethodDefinition<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, fintekkers_requests_util_lock_lock_response_pb.LockResponseProto> {
    path: "/fintekkers.services.lock_service.Lock/ClaimLock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;
}

export const LockService: ILockService;

export interface ILockServer extends grpc.UntypedServiceImplementation {
    claimLock: grpc.handleUnaryCall<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;
}

export interface ILockClient {
    claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
}

export class LockClient extends grpc.Client implements ILockClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    public claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    public claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
}
