import * as grpcWeb from 'grpc-web';

import * as fintekkers_requests_price_create_price_request_pb from '../../../fintekkers/requests/price/create_price_request_pb';
import * as fintekkers_requests_price_create_price_response_pb from '../../../fintekkers/requests/price/create_price_response_pb';
import * as fintekkers_requests_price_query_price_request_pb from '../../../fintekkers/requests/price/query_price_request_pb';
import * as fintekkers_requests_price_query_price_response_pb from '../../../fintekkers/requests/price/query_price_response_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../fintekkers/requests/util/errors/summary_pb';


export class PriceClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto>;

  getByIds(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;

  search(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;

  listIds(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

export class PricePromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto>;

  getByIds(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;

  search(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;

  listIds(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

