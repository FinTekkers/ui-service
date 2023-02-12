import * as jspb from 'google-protobuf'

import * as fintekkers_models_strategy_strategy_pb from '../../../fintekkers/models/strategy/strategy_pb';
import * as fintekkers_models_util_local_timestamp_pb from '../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_models_util_decimal_value_pb from '../../../fintekkers/models/util/decimal_value_pb';
import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';


export class MapFieldEntry extends jspb.Message {
  getKey(): fintekkers_models_strategy_strategy_pb.StrategyProto | undefined;
  setKey(value?: fintekkers_models_strategy_strategy_pb.StrategyProto): MapFieldEntry;
  hasKey(): boolean;
  clearKey(): MapFieldEntry;

  getValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
  setValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): MapFieldEntry;
  hasValue(): boolean;
  clearValue(): MapFieldEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MapFieldEntry.AsObject;
  static toObject(includeInstance: boolean, msg: MapFieldEntry): MapFieldEntry.AsObject;
  static serializeBinaryToWriter(message: MapFieldEntry, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MapFieldEntry;
  static deserializeBinaryFromReader(message: MapFieldEntry, reader: jspb.BinaryReader): MapFieldEntry;
}

export namespace MapFieldEntry {
  export type AsObject = {
    key?: fintekkers_models_strategy_strategy_pb.StrategyProto.AsObject,
    value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
  }
}

export class StrategyAllocationProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): StrategyAllocationProto;

  getVersion(): string;
  setVersion(value: string): StrategyAllocationProto;

  getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
  setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): StrategyAllocationProto;
  hasUuid(): boolean;
  clearUuid(): StrategyAllocationProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyAllocationProto;
  hasAsOf(): boolean;
  clearAsOf(): StrategyAllocationProto;

  getIsLink(): boolean;
  setIsLink(value: boolean): StrategyAllocationProto;

  getAllocationsList(): Array<MapFieldEntry>;
  setAllocationsList(value: Array<MapFieldEntry>): StrategyAllocationProto;
  clearAllocationsList(): StrategyAllocationProto;
  addAllocations(value?: MapFieldEntry, index?: number): MapFieldEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StrategyAllocationProto.AsObject;
  static toObject(includeInstance: boolean, msg: StrategyAllocationProto): StrategyAllocationProto.AsObject;
  static serializeBinaryToWriter(message: StrategyAllocationProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StrategyAllocationProto;
  static deserializeBinaryFromReader(message: StrategyAllocationProto, reader: jspb.BinaryReader): StrategyAllocationProto;
}

export namespace StrategyAllocationProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    isLink: boolean,
    allocationsList: Array<MapFieldEntry.AsObject>,
  }
}

