import * as jspb from 'google-protobuf'

import * as fintekkers_models_portfolio_portfolio_pb from '../../../fintekkers/models/portfolio/portfolio_pb';
import * as fintekkers_requests_portfolio_query_portfolio_request_pb from '../../../fintekkers/requests/portfolio/query_portfolio_request_pb';


export class QueryPortfolioResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QueryPortfolioResponseProto;

  getVersion(): string;
  setVersion(value: string): QueryPortfolioResponseProto;

  getQueryPortfolioRequest(): fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto | undefined;
  setQueryPortfolioRequest(value?: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto): QueryPortfolioResponseProto;
  hasQueryPortfolioRequest(): boolean;
  clearQueryPortfolioRequest(): QueryPortfolioResponseProto;

  getPortfolioResponseList(): Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto>;
  setPortfolioResponseList(value: Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto>): QueryPortfolioResponseProto;
  clearPortfolioResponseList(): QueryPortfolioResponseProto;
  addPortfolioResponse(value?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto, index?: number): fintekkers_models_portfolio_portfolio_pb.PortfolioProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryPortfolioResponseProto.AsObject;
  static toObject(includeInstance: boolean, msg: QueryPortfolioResponseProto): QueryPortfolioResponseProto.AsObject;
  static serializeBinaryToWriter(message: QueryPortfolioResponseProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryPortfolioResponseProto;
  static deserializeBinaryFromReader(message: QueryPortfolioResponseProto, reader: jspb.BinaryReader): QueryPortfolioResponseProto;
}

export namespace QueryPortfolioResponseProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    queryPortfolioRequest?: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto.AsObject,
    portfolioResponseList: Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto.AsObject>,
  }
}

