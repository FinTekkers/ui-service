import * as jspb from 'google-protobuf'

import * as fintekkers_models_transaction_transaction_pb from '../../../fintekkers/models/transaction/transaction_pb';


export class CreateTransactionRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): CreateTransactionRequestProto;

  getVersion(): string;
  setVersion(value: string): CreateTransactionRequestProto;

  getCreateTransactionInput(): fintekkers_models_transaction_transaction_pb.TransactionProto | undefined;
  setCreateTransactionInput(value?: fintekkers_models_transaction_transaction_pb.TransactionProto): CreateTransactionRequestProto;
  hasCreateTransactionInput(): boolean;
  clearCreateTransactionInput(): CreateTransactionRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateTransactionRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: CreateTransactionRequestProto): CreateTransactionRequestProto.AsObject;
  static serializeBinaryToWriter(message: CreateTransactionRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateTransactionRequestProto;
  static deserializeBinaryFromReader(message: CreateTransactionRequestProto, reader: jspb.BinaryReader): CreateTransactionRequestProto;
}

export namespace CreateTransactionRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    createTransactionInput?: fintekkers_models_transaction_transaction_pb.TransactionProto.AsObject,
  }
}

