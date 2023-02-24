// package: fintekkers.requests.util.errors
// file: fintekkers/requests/util/errors/error.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_requests_util_errors_message_pb from "../../../../fintekkers/requests/util/errors/message_pb";

export class ErrorProto extends jspb.Message { 
    getCode(): ErrorCode;
    setCode(value: ErrorCode): ErrorProto;

    hasDetail(): boolean;
    clearDetail(): void;
    getDetail(): fintekkers_requests_util_errors_message_pb.Message | undefined;
    setDetail(value?: fintekkers_requests_util_errors_message_pb.Message): ErrorProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ErrorProto.AsObject;
    static toObject(includeInstance: boolean, msg: ErrorProto): ErrorProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ErrorProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ErrorProto;
    static deserializeBinaryFromReader(message: ErrorProto, reader: jspb.BinaryReader): ErrorProto;
}

export namespace ErrorProto {
    export type AsObject = {
        code: ErrorCode,
        detail?: fintekkers_requests_util_errors_message_pb.Message.AsObject,
    }
}

export class WarningProto extends jspb.Message { 
    getCode(): ErrorCode;
    setCode(value: ErrorCode): WarningProto;

    hasDetail(): boolean;
    clearDetail(): void;
    getDetail(): fintekkers_requests_util_errors_message_pb.Message | undefined;
    setDetail(value?: fintekkers_requests_util_errors_message_pb.Message): WarningProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WarningProto.AsObject;
    static toObject(includeInstance: boolean, msg: WarningProto): WarningProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WarningProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WarningProto;
    static deserializeBinaryFromReader(message: WarningProto, reader: jspb.BinaryReader): WarningProto;
}

export namespace WarningProto {
    export type AsObject = {
        code: ErrorCode,
        detail?: fintekkers_requests_util_errors_message_pb.Message.AsObject,
    }
}

export enum ErrorCode {
    UNKNOWN_ERROR = 0,
    WARNING = 1,
}
