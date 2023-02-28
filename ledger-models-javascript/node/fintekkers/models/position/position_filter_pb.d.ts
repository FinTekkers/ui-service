// package: fintekkers.models.position
// file: fintekkers/models/position/position_filter.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_position_util_pb from "../../../fintekkers/models/position/position_util_pb";

export class PositionFilterProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): PositionFilterProto;
    getVersion(): string;
    setVersion(value: string): PositionFilterProto;
    clearFiltersList(): void;
    getFiltersList(): Array<fintekkers_models_position_position_util_pb.FieldMapEntry>;
    setFiltersList(value: Array<fintekkers_models_position_position_util_pb.FieldMapEntry>): PositionFilterProto;
    addFilters(value?: fintekkers_models_position_position_util_pb.FieldMapEntry, index?: number): fintekkers_models_position_position_util_pb.FieldMapEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PositionFilterProto.AsObject;
    static toObject(includeInstance: boolean, msg: PositionFilterProto): PositionFilterProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PositionFilterProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PositionFilterProto;
    static deserializeBinaryFromReader(message: PositionFilterProto, reader: jspb.BinaryReader): PositionFilterProto;
}

export namespace PositionFilterProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        filtersList: Array<fintekkers_models_position_position_util_pb.FieldMapEntry.AsObject>,
    }
}
