// package: fintekkers.requests.util.errors
// file: fintekkers/requests/util/errors/summary.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_requests_util_errors_error_pb from "../../../../fintekkers/requests/util/errors/error_pb";

export class SummaryProto extends jspb.Message { 
    clearErrorsList(): void;
    getErrorsList(): Array<fintekkers_requests_util_errors_error_pb.ErrorProto>;
    setErrorsList(value: Array<fintekkers_requests_util_errors_error_pb.ErrorProto>): SummaryProto;
    addErrors(value?: fintekkers_requests_util_errors_error_pb.ErrorProto, index?: number): fintekkers_requests_util_errors_error_pb.ErrorProto;
    clearWarningsList(): void;
    getWarningsList(): Array<fintekkers_requests_util_errors_error_pb.WarningProto>;
    setWarningsList(value: Array<fintekkers_requests_util_errors_error_pb.WarningProto>): SummaryProto;
    addWarnings(value?: fintekkers_requests_util_errors_error_pb.WarningProto, index?: number): fintekkers_requests_util_errors_error_pb.WarningProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SummaryProto.AsObject;
    static toObject(includeInstance: boolean, msg: SummaryProto): SummaryProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
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
