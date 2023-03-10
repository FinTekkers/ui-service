// package: fintekkers.services.security_service
// file: fintekkers/services/portfolio-service/portfolio_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_portfolio_service_portfolio_service_pb from "../../../fintekkers/services/portfolio-service/portfolio_service_pb";
import * as fintekkers_requests_portfolio_create_portfolio_request_pb from "../../../fintekkers/requests/portfolio/create_portfolio_request_pb";
import * as fintekkers_requests_portfolio_create_portfolio_response_pb from "../../../fintekkers/requests/portfolio/create_portfolio_response_pb";
import * as fintekkers_requests_portfolio_query_portfolio_request_pb from "../../../fintekkers/requests/portfolio/query_portfolio_request_pb";
import * as fintekkers_requests_portfolio_query_portfolio_response_pb from "../../../fintekkers/requests/portfolio/query_portfolio_response_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

interface IPortfolioService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createOrUpdate: IPortfolioService_ICreateOrUpdate;
    getByIDs: IPortfolioService_IGetByIDs;
    search: IPortfolioService_ISearch;
    listIDs: IPortfolioService_IListIDs;
    validateCreateOrUpdate: IPortfolioService_IValidateCreateOrUpdate;
    validateQueryRequest: IPortfolioService_IValidateQueryRequest;
}

interface IPortfolioService_ICreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto> {
    path: "/fintekkers.services.security_service.Portfolio/CreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;
}
interface IPortfolioService_IGetByIDs extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto> {
    path: "/fintekkers.services.security_service.Portfolio/GetByIDs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
}
interface IPortfolioService_ISearch extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto> {
    path: "/fintekkers.services.security_service.Portfolio/Search";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
}
interface IPortfolioService_IListIDs extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto> {
    path: "/fintekkers.services.security_service.Portfolio/ListIDs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
}
interface IPortfolioService_IValidateCreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.security_service.Portfolio/ValidateCreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}
interface IPortfolioService_IValidateQueryRequest extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.security_service.Portfolio/ValidateQueryRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export const PortfolioService: IPortfolioService;

export interface IPortfolioServer extends grpc.UntypedServiceImplementation {
    createOrUpdate: grpc.handleUnaryCall<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;
    getByIDs: grpc.handleUnaryCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    search: grpc.handleServerStreamingCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    listIDs: grpc.handleUnaryCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    validateCreateOrUpdate: grpc.handleUnaryCall<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    validateQueryRequest: grpc.handleUnaryCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export interface IPortfolioClient {
    createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    listIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    listIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    listIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}

export class PortfolioClient extends grpc.Client implements IPortfolioClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    public search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    public listIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public listIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public listIDs(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}
