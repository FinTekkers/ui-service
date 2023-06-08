import * as jspb from 'google-protobuf'

import * as fintekkers_models_price_price_pb from '../../../fintekkers/models/price/price_pb';


export class CreatePriceRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): CreatePriceRequestProto;

  getVersion(): string;
  setVersion(value: string): CreatePriceRequestProto;

  getCreatePriceInput(): fintekkers_models_price_price_pb.PriceProto | undefined;
  setCreatePriceInput(value?: fintekkers_models_price_price_pb.PriceProto): CreatePriceRequestProto;
  hasCreatePriceInput(): boolean;
  clearCreatePriceInput(): CreatePriceRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreatePriceRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: CreatePriceRequestProto): CreatePriceRequestProto.AsObject;
  static serializeBinaryToWriter(message: CreatePriceRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreatePriceRequestProto;
  static deserializeBinaryFromReader(message: CreatePriceRequestProto, reader: jspb.BinaryReader): CreatePriceRequestProto;
}

export namespace CreatePriceRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    createPriceInput?: fintekkers_models_price_price_pb.PriceProto.AsObject,
  }
}

