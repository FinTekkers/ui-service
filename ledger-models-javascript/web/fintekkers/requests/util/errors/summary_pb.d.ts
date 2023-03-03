import * as jspb from 'google-protobuf'

import * as fintekkers_requests_util_errors_error_pb from '../../../../fintekkers/requests/util/errors/error_pb';


export class SummaryProto extends jspb.Message {
  getErrorsList(): Array<fintekkers_requests_util_errors_error_pb.ErrorProto>;
  setErrorsList(value: Array<fintekkers_requests_util_errors_error_pb.ErrorProto>): SummaryProto;
  clearErrorsList(): SummaryProto;
  addErrors(value?: fintekkers_requests_util_errors_error_pb.ErrorProto, index?: number): fintekkers_requests_util_errors_error_pb.ErrorProto;

  getWarningsList(): Array<fintekkers_requests_util_errors_error_pb.WarningProto>;
  setWarningsList(value: Array<fintekkers_requests_util_errors_error_pb.WarningProto>): SummaryProto;
  clearWarningsList(): SummaryProto;
  addWarnings(value?: fintekkers_requests_util_errors_error_pb.WarningProto, index?: number): fintekkers_requests_util_errors_error_pb.WarningProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SummaryProto.AsObject;
  static toObject(includeInstance: boolean, msg: SummaryProto): SummaryProto.AsObject;
  static serializeBinaryToWriter(message: SummaryProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SummaryProto;
  static deserializeBinaryFromReader(message: SummaryProto, reader: jspb.BinaryReader): SummaryProto;
}

export namespace SummaryProto {
  export type AsObject = {
    errorsList: Array<fintekkers_requests_util_errors_error_pb.ErrorProto.AsObject>,
    warningsList: Array<fintekkers_requests_util_errors_error_pb.WarningProto.AsObject>,
  }
}

