// package: fintekkers.requests.price
// file: fintekkers/requests/price/query_price_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_position_position_filter_pb from "../../../fintekkers/models/position/position_filter_pb";

export class QueryPriceRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QueryPriceRequestProto;
    getVersion(): string;
    setVersion(value: string): QueryPriceRequestProto;
    clearUuidsList(): void;
    getUuidsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
    setUuidsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): QueryPriceRequestProto;
    addUuids(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;

    hasSearchPriceInput(): boolean;
    clearSearchPriceInput(): void;
    getSearchPriceInput(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
    setSearchPriceInput(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QueryPriceRequestProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): QueryPriceRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryPriceRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: QueryPriceRequestProto): QueryPriceRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryPriceRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryPriceRequestProto;
    static deserializeBinaryFromReader(message: QueryPriceRequestProto, reader: jspb.BinaryReader): QueryPriceRequestProto;
}

export namespace QueryPriceRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuidsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
        searchPriceInput?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    }
}
