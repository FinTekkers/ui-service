import * as grpcWeb from 'grpc-web';

import * as fintekkers_requests_valuation_valuation_request_pb from '../../../fintekkers/requests/valuation/valuation_request_pb';
import * as fintekkers_requests_valuation_valuation_response_pb from '../../../fintekkers/requests/valuation/valuation_response_pb';


export class ValuationClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  runValuation(
    request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto>;

}

export class ValuationPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  runValuation(
    request: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_valuation_valuation_response_pb.ValuationResponseProto>;

}

