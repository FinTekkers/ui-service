// package: fintekkers.models.util
// file: fintekkers/models/util/decimal_value.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class DecimalValueProto extends jspb.Message { 
    getArbitraryPrecisionValue(): string;
    setArbitraryPrecisionValue(value: string): DecimalValueProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecimalValueProto.AsObject;
    static toObject(includeInstance: boolean, msg: DecimalValueProto): DecimalValueProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecimalValueProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecimalValueProto;
    static deserializeBinaryFromReader(message: DecimalValueProto, reader: jspb.BinaryReader): DecimalValueProto;
}

export namespace DecimalValueProto {
    export type AsObject = {
        arbitraryPrecisionValue: string,
    }
}
