// package: fintekkers.services.security_service
// file: fintekkers/services/transaction-service/transaction_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_transaction_service_transaction_service_pb from "../../../fintekkers/services/transaction-service/transaction_service_pb";
import * as fintekkers_requests_transaction_create_transaction_request_pb from "../../../fintekkers/requests/transaction/create_transaction_request_pb";
import * as fintekkers_requests_transaction_create_transaction_response_pb from "../../../fintekkers/requests/transaction/create_transaction_response_pb";
import * as fintekkers_requests_transaction_query_transaction_request_pb from "../../../fintekkers/requests/transaction/query_transaction_request_pb";
import * as fintekkers_requests_transaction_query_transaction_response_pb from "../../../fintekkers/requests/transaction/query_transaction_response_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

interface ITransactionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createOrUpdate: ITransactionService_ICreateOrUpdate;
    getByIDs: ITransactionService_IGetByIDs;
    search: ITransactionService_ISearch;
    listIDs: ITransactionService_IListIDs;
    validateCreateOrUpdate: ITransactionService_IValidateCreateOrUpdate;
    validateQueryRequest: ITransactionService_IValidateQueryRequest;
}

interface ITransactionService_ICreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto> {
    path: "/fintekkers.services.security_service.Transaction/CreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;
}
interface ITransactionService_IGetByIDs extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto> {
    path: "/fintekkers.services.security_service.Transaction/GetByIDs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
}
interface ITransactionService_ISearch extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto> {
    path: "/fintekkers.services.security_service.Transaction/Search";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
}
interface ITransactionService_IListIDs extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto> {
    path: "/fintekkers.services.security_service.Transaction/ListIDs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
}
interface ITransactionService_IValidateCreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.security_service.Transaction/ValidateCreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}
interface ITransactionService_IValidateQueryRequest extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.security_service.Transaction/ValidateQueryRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export const TransactionService: ITransactionService;

export interface ITransactionServer extends grpc.UntypedServiceImplementation {
    createOrUpdate: grpc.handleUnaryCall<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;
    getByIDs: grpc.handleUnaryCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    search: grpc.handleUnaryCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    listIDs: grpc.handleUnaryCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    validateCreateOrUpdate: grpc.handleUnaryCall<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    validateQueryRequest: grpc.handleUnaryCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export interface ITransactionClient {
    createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    getByIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    listIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    listIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    listIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}

export class TransactionClient extends grpc.Client implements ITransactionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public getByIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public listIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public listIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public listIDs(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}
