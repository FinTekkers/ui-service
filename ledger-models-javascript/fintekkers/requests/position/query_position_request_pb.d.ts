import * as jspb from 'google-protobuf'

import * as fintekkers_models_position_field_pb from '../../../fintekkers/models/position/field_pb';
import * as fintekkers_models_position_measure_pb from '../../../fintekkers/models/position/measure_pb';
import * as fintekkers_models_position_position_pb from '../../../fintekkers/models/position/position_pb';
import * as fintekkers_models_position_position_filter_pb from '../../../fintekkers/models/position/position_filter_pb';
import * as fintekkers_models_util_local_timestamp_pb from '../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_requests_util_operation_pb from '../../../fintekkers/requests/util/operation_pb';


export class QueryPositionRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QueryPositionRequestProto;

  getVersion(): string;
  setVersion(value: string): QueryPositionRequestProto;

  getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
  setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): QueryPositionRequestProto;

  getPositionType(): fintekkers_models_position_position_pb.PositionTypeProto;
  setPositionType(value: fintekkers_models_position_position_pb.PositionTypeProto): QueryPositionRequestProto;

  getPositionView(): fintekkers_models_position_position_pb.PositionViewProto;
  setPositionView(value: fintekkers_models_position_position_pb.PositionViewProto): QueryPositionRequestProto;

  getFieldsList(): Array<fintekkers_models_position_field_pb.FieldProto>;
  setFieldsList(value: Array<fintekkers_models_position_field_pb.FieldProto>): QueryPositionRequestProto;
  clearFieldsList(): QueryPositionRequestProto;
  addFields(value: fintekkers_models_position_field_pb.FieldProto, index?: number): QueryPositionRequestProto;

  getMeasuresList(): Array<fintekkers_models_position_measure_pb.MeasureProto>;
  setMeasuresList(value: Array<fintekkers_models_position_measure_pb.MeasureProto>): QueryPositionRequestProto;
  clearMeasuresList(): QueryPositionRequestProto;
  addMeasures(value: fintekkers_models_position_measure_pb.MeasureProto, index?: number): QueryPositionRequestProto;

  getFilterFields(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
  setFilterFields(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QueryPositionRequestProto;
  hasFilterFields(): boolean;
  clearFilterFields(): QueryPositionRequestProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): QueryPositionRequestProto;
  hasAsOf(): boolean;
  clearAsOf(): QueryPositionRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryPositionRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: QueryPositionRequestProto): QueryPositionRequestProto.AsObject;
  static serializeBinaryToWriter(message: QueryPositionRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryPositionRequestProto;
  static deserializeBinaryFromReader(message: QueryPositionRequestProto, reader: jspb.BinaryReader): QueryPositionRequestProto;
}

export namespace QueryPositionRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
    positionType: fintekkers_models_position_position_pb.PositionTypeProto,
    positionView: fintekkers_models_position_position_pb.PositionViewProto,
    fieldsList: Array<fintekkers_models_position_field_pb.FieldProto>,
    measuresList: Array<fintekkers_models_position_measure_pb.MeasureProto>,
    filterFields?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
  }
}

