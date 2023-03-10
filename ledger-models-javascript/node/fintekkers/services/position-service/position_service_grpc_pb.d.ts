// package: fintekkers.services.position_service
// file: fintekkers/services/position-service/position_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_position_service_position_service_pb from "../../../fintekkers/services/position-service/position_service_pb";
import * as fintekkers_requests_position_query_position_request_pb from "../../../fintekkers/requests/position/query_position_request_pb";
import * as fintekkers_requests_position_query_position_response_pb from "../../../fintekkers/requests/position/query_position_response_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

interface IPositionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    search: IPositionService_ISearch;
    validateQueryRequest: IPositionService_IValidateQueryRequest;
}

interface IPositionService_ISearch extends grpc.MethodDefinition<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto> {
    path: "/fintekkers.services.position_service.Position/Search";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;
}
interface IPositionService_IValidateQueryRequest extends grpc.MethodDefinition<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.position_service.Position/ValidateQueryRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export const PositionService: IPositionService;

export interface IPositionServer extends grpc.UntypedServiceImplementation {
    search: grpc.handleServerStreamingCall<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;
    validateQueryRequest: grpc.handleUnaryCall<fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export interface IPositionClient {
    search(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;
    search(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;
    validateQueryRequest(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}

export class PositionClient extends grpc.Client implements IPositionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public search(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;
    public search(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;
    public validateQueryRequest(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}
