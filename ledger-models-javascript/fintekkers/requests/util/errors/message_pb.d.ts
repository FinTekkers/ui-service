import * as jspb from 'google-protobuf'



export class Message extends jspb.Message {
  getMessageForUser(): string;
  setMessageForUser(value: string): Message;

  getMessageForDeveloper(): string;
  setMessageForDeveloper(value: string): Message;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Message.AsObject;
  static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
  static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Message;
  static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
  export type AsObject = {
    messageForUser: string,
    messageForDeveloper: string,
  }
}

