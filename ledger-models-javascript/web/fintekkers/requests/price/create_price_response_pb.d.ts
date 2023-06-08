import * as jspb from 'google-protobuf'

import * as fintekkers_models_price_price_pb from '../../../fintekkers/models/price/price_pb';
import * as fintekkers_requests_price_create_price_request_pb from '../../../fintekkers/requests/price/create_price_request_pb';


export class CreatePriceResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): CreatePriceResponseProto;

  getVersion(): string;
  setVersion(value: string): CreatePriceResponseProto;

  getCreatePriceRequest(): fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto | undefined;
  setCreatePriceRequest(value?: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto): CreatePriceResponseProto;
  hasCreatePriceRequest(): boolean;
  clearCreatePriceRequest(): CreatePriceResponseProto;

  getPriceResponseList(): Array<fintekkers_models_price_price_pb.PriceProto>;
  setPriceResponseList(value: Array<fintekkers_models_price_price_pb.PriceProto>): CreatePriceResponseProto;
  clearPriceResponseList(): CreatePriceResponseProto;
  addPriceResponse(value?: fintekkers_models_price_price_pb.PriceProto, index?: number): fintekkers_models_price_price_pb.PriceProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreatePriceResponseProto.AsObject;
  static toObject(includeInstance: boolean, msg: CreatePriceResponseProto): CreatePriceResponseProto.AsObject;
  static serializeBinaryToWriter(message: CreatePriceResponseProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreatePriceResponseProto;
  static deserializeBinaryFromReader(message: CreatePriceResponseProto, reader: jspb.BinaryReader): CreatePriceResponseProto;
}

export namespace CreatePriceResponseProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    createPriceRequest?: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto.AsObject,
    priceResponseList: Array<fintekkers_models_price_price_pb.PriceProto.AsObject>,
  }
}

