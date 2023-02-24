// package: fintekkers.services.valuation_service
// file: fintekkers/services/valuation-service/valuation_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_valuation_service_valuation_service_pb from "../../../fintekkers/services/valuation-service/valuation_service_pb";
import * as fintekkers_requests_valuation_valuation_request_pb from "../../../fintekkers/requests/valuation/valuation_request_pb";
import * as fintekkers_requests_valuation_valuation_response_pb from "../../../fintekkers/requests/valuation/valuation_response_pb";

interface IValuationService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    runValuation: IValuationService_IRunValuation;
}

interface IValuationService_IRunValuation extends grpc.MethodDefinition<fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto> {
    path: "/fintekkers.services.valuation_service.Valuation/RunValuation";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto>;
}

export const ValuationService: IValuationService;

export interface IValuationServer extends grpc.UntypedServiceImplementation {
    runValuation: grpc.handleUnaryCall<fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto>;
}

export interface IValuationClient {
    runValuation(request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto) => void): grpc.ClientUnaryCall;
    runValuation(request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto) => void): grpc.ClientUnaryCall;
    runValuation(request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto) => void): grpc.ClientUnaryCall;
}

export class ValuationClient extends grpc.Client implements IValuationClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public runValuation(request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto) => void): grpc.ClientUnaryCall;
    public runValuation(request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto) => void): grpc.ClientUnaryCall;
    public runValuation(request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto) => void): grpc.ClientUnaryCall;
}
