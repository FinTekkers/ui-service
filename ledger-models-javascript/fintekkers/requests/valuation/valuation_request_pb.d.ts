import * as jspb from 'google-protobuf'

import * as fintekkers_models_security_security_pb from '../../../fintekkers/models/security/security_pb';
import * as fintekkers_models_position_position_pb from '../../../fintekkers/models/position/position_pb';
import * as fintekkers_models_price_price_pb from '../../../fintekkers/models/price/price_pb';
import * as fintekkers_requests_util_operation_pb from '../../../fintekkers/requests/util/operation_pb';
import * as fintekkers_models_position_measure_pb from '../../../fintekkers/models/position/measure_pb';


export class ValuationRequestProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): ValuationRequestProto;

  getVersion(): string;
  setVersion(value: string): ValuationRequestProto;

  getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
  setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): ValuationRequestProto;

  getMeasuresList(): Array<fintekkers_models_position_measure_pb.MeasureProto>;
  setMeasuresList(value: Array<fintekkers_models_position_measure_pb.MeasureProto>): ValuationRequestProto;
  clearMeasuresList(): ValuationRequestProto;
  addMeasures(value: fintekkers_models_position_measure_pb.MeasureProto, index?: number): ValuationRequestProto;

  getSecurityInput(): fintekkers_models_security_security_pb.SecurityProto | undefined;
  setSecurityInput(value?: fintekkers_models_security_security_pb.SecurityProto): ValuationRequestProto;
  hasSecurityInput(): boolean;
  clearSecurityInput(): ValuationRequestProto;

  getPositionInput(): fintekkers_models_position_position_pb.PositionProto | undefined;
  setPositionInput(value?: fintekkers_models_position_position_pb.PositionProto): ValuationRequestProto;
  hasPositionInput(): boolean;
  clearPositionInput(): ValuationRequestProto;

  getPriceInput(): fintekkers_models_price_price_pb.PriceProto | undefined;
  setPriceInput(value?: fintekkers_models_price_price_pb.PriceProto): ValuationRequestProto;
  hasPriceInput(): boolean;
  clearPriceInput(): ValuationRequestProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ValuationRequestProto.AsObject;
  static toObject(includeInstance: boolean, msg: ValuationRequestProto): ValuationRequestProto.AsObject;
  static serializeBinaryToWriter(message: ValuationRequestProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ValuationRequestProto;
  static deserializeBinaryFromReader(message: ValuationRequestProto, reader: jspb.BinaryReader): ValuationRequestProto;
}

export namespace ValuationRequestProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
    measuresList: Array<fintekkers_models_position_measure_pb.MeasureProto>,
    securityInput?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
    positionInput?: fintekkers_models_position_position_pb.PositionProto.AsObject,
    priceInput?: fintekkers_models_price_price_pb.PriceProto.AsObject,
  }
}

