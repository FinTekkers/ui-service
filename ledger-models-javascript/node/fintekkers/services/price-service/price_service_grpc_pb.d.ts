// package: fintekkers.services.price_service
// file: fintekkers/services/price-service/price_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_price_service_price_service_pb from "../../../fintekkers/services/price-service/price_service_pb";
import * as fintekkers_requests_price_query_price_request_pb from "../../../fintekkers/requests/price/query_price_request_pb";
import * as fintekkers_requests_price_query_price_response_pb from "../../../fintekkers/requests/price/query_price_response_pb";
import * as fintekkers_requests_price_create_price_request_pb from "../../../fintekkers/requests/price/create_price_request_pb";
import * as fintekkers_requests_price_create_price_response_pb from "../../../fintekkers/requests/price/create_price_response_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

interface ISecurityService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createOrUpdate: ISecurityService_ICreateOrUpdate;
    getByIDs: ISecurityService_IGetByIDs;
    search: ISecurityService_ISearch;
    listIDs: ISecurityService_IListIDs;
    validateCreateOrUpdate: ISecurityService_IValidateCreateOrUpdate;
    validateQueryRequest: ISecurityService_IValidateQueryRequest;
}

interface ISecurityService_ICreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto> {
    path: "/fintekkers.services.price_service.Security/CreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto>;
}
interface ISecurityService_IGetByIDs extends grpc.MethodDefinition<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto> {
    path: "/fintekkers.services.price_service.Security/GetByIDs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
}
interface ISecurityService_ISearch extends grpc.MethodDefinition<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto> {
    path: "/fintekkers.services.price_service.Security/Search";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
}
interface ISecurityService_IListIDs extends grpc.MethodDefinition<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto> {
    path: "/fintekkers.services.price_service.Security/ListIDs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
}
interface ISecurityService_IValidateCreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.price_service.Security/ValidateCreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}
interface ISecurityService_IValidateQueryRequest extends grpc.MethodDefinition<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.price_service.Security/ValidateQueryRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export const SecurityService: ISecurityService;

export interface ISecurityServer extends grpc.UntypedServiceImplementation {
    createOrUpdate: grpc.handleUnaryCall<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto>;
    getByIDs: grpc.handleUnaryCall<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    search: grpc.handleServerStreamingCall<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    listIDs: grpc.handleUnaryCall<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    validateCreateOrUpdate: grpc.handleUnaryCall<fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    validateQueryRequest: grpc.handleUnaryCall<fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export interface ISecurityClient {
    createOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    search(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    listIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    listIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    listIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}

export class SecurityClient extends grpc.Client implements ISecurityClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    public search(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;
    public listIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    public listIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    public listIDs(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}
