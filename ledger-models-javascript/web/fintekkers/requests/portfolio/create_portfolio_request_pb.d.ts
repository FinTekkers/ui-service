import * as jspb from 'google-protobuf'

import * as fintekkers_models_portfolio_portfolio_pb from '../../../fintekkers/models/portfolio/portfolio_pb';


export class CreatePortfolioRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): CreatePortfolioRequestProto;

  getVersion(): string;
  setVersion(value: string): CreatePortfolioRequestProto;

  getCreatePortfolioInput(): fintekkers_models_portfolio_portfolio_pb.PortfolioProto | undefined;
  setCreatePortfolioInput(value?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto): CreatePortfolioRequestProto;
  hasCreatePortfolioInput(): boolean;
  clearCreatePortfolioInput(): CreatePortfolioRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreatePortfolioRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: CreatePortfolioRequestProto): CreatePortfolioRequestProto.AsObject;
  static serializeBinaryToWriter(message: CreatePortfolioRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreatePortfolioRequestProto;
  static deserializeBinaryFromReader(message: CreatePortfolioRequestProto, reader: jspb.BinaryReader): CreatePortfolioRequestProto;
}

export namespace CreatePortfolioRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    createPortfolioInput?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto.AsObject,
  }
}

