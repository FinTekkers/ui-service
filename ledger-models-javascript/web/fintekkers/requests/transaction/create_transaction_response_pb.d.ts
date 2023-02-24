import * as jspb from 'google-protobuf'

import * as fintekkers_models_transaction_transaction_pb from '../../../fintekkers/models/transaction/transaction_pb';
import * as fintekkers_requests_transaction_create_transaction_request_pb from '../../../fintekkers/requests/transaction/create_transaction_request_pb';


export class CreateTransactionResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): CreateTransactionResponseProto;

  getVersion(): string;
  setVersion(value: string): CreateTransactionResponseProto;

  getCreateTransactionRequest(): fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto | undefined;
  setCreateTransactionRequest(value?: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto): CreateTransactionResponseProto;
  hasCreateTransactionRequest(): boolean;
  clearCreateTransactionRequest(): CreateTransactionResponseProto;

  getTransactionResponse(): fintekkers_models_transaction_transaction_pb.TransactionProto | undefined;
  setTransactionResponse(value?: fintekkers_models_transaction_transaction_pb.TransactionProto): CreateTransactionResponseProto;
  hasTransactionResponse(): boolean;
  clearTransactionResponse(): CreateTransactionResponseProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateTransactionResponseProto.AsObject;
  static toObject(includeInstance: boolean, msg: CreateTransactionResponseProto): CreateTransactionResponseProto.AsObject;
  static serializeBinaryToWriter(message: CreateTransactionResponseProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateTransactionResponseProto;
  static deserializeBinaryFromReader(message: CreateTransactionResponseProto, reader: jspb.BinaryReader): CreateTransactionResponseProto;
}

export namespace CreateTransactionResponseProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    createTransactionRequest?: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto.AsObject,
    transactionResponse?: fintekkers_models_transaction_transaction_pb.TransactionProto.AsObject,
  }
}

