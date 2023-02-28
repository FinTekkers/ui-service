import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';


export class LocalTimestampProto extends jspb.Message {
  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): LocalTimestampProto;
  hasTimestamp(): boolean;
  clearTimestamp(): LocalTimestampProto;

  getTimeZone(): string;
  setTimeZone(value: string): LocalTimestampProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LocalTimestampProto.AsObject;
  static toObject(includeInstance: boolean, msg: LocalTimestampProto): LocalTimestampProto.AsObject;
  static serializeBinaryToWriter(message: LocalTimestampProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LocalTimestampProto;
  static deserializeBinaryFromReader(message: LocalTimestampProto, reader: jspb.BinaryReader): LocalTimestampProto;
}

export namespace LocalTimestampProto {
  export type AsObject = {
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    timeZone: string,
  }
}

