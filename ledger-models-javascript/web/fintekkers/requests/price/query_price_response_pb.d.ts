import * as jspb from 'google-protobuf'

import * as fintekkers_models_price_price_pb from '../../../fintekkers/models/price/price_pb';
import * as fintekkers_requests_price_query_price_request_pb from '../../../fintekkers/requests/price/query_price_request_pb';


export class QueryPriceResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QueryPriceResponseProto;

  getVersion(): string;
  setVersion(value: string): QueryPriceResponseProto;

  getQueryPriceRequest(): fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto | undefined;
  setQueryPriceRequest(value?: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto): QueryPriceResponseProto;
  hasQueryPriceRequest(): boolean;
  clearQueryPriceRequest(): QueryPriceResponseProto;

  getPriceResponseList(): Array<fintekkers_models_price_price_pb.PriceProto>;
  setPriceResponseList(value: Array<fintekkers_models_price_price_pb.PriceProto>): QueryPriceResponseProto;
  clearPriceResponseList(): QueryPriceResponseProto;
  addPriceResponse(value?: fintekkers_models_price_price_pb.PriceProto, index?: number): fintekkers_models_price_price_pb.PriceProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryPriceResponseProto.AsObject;
  static toObject(includeInstance: boolean, msg: QueryPriceResponseProto): QueryPriceResponseProto.AsObject;
  static serializeBinaryToWriter(message: QueryPriceResponseProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryPriceResponseProto;
  static deserializeBinaryFromReader(message: QueryPriceResponseProto, reader: jspb.BinaryReader): QueryPriceResponseProto;
}

export namespace QueryPriceResponseProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    queryPriceRequest?: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto.AsObject,
    priceResponseList: Array<fintekkers_models_price_price_pb.PriceProto.AsObject>,
  }
}

