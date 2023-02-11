import * as jspb from 'google-protobuf'

import * as fintekkers_models_util_decimal_value_pb from '../../../fintekkers/models/util/decimal_value_pb';
import * as fintekkers_models_util_local_date_pb from '../../../fintekkers/models/util/local_date_pb';
import * as fintekkers_models_util_local_timestamp_pb from '../../../fintekkers/models/util/local_timestamp_pb';
import * as fintekkers_models_util_uuid_pb from '../../../fintekkers/models/util/uuid_pb';
import * as fintekkers_models_portfolio_portfolio_pb from '../../../fintekkers/models/portfolio/portfolio_pb';
import * as fintekkers_models_strategy_strategy_allocation_pb from '../../../fintekkers/models/strategy/strategy_allocation_pb';
import * as fintekkers_models_security_security_pb from '../../../fintekkers/models/security/security_pb';
import * as fintekkers_models_price_price_pb from '../../../fintekkers/models/price/price_pb';
import * as fintekkers_models_position_position_status_pb from '../../../fintekkers/models/position/position_status_pb';
import * as fintekkers_models_transaction_transaction_type_pb from '../../../fintekkers/models/transaction/transaction_type_pb';


export class TransactionProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): TransactionProto;

  getVersion(): string;
  setVersion(value: string): TransactionProto;

  getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
  setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): TransactionProto;
  hasUuid(): boolean;
  clearUuid(): TransactionProto;

  getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
  setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): TransactionProto;
  hasAsOf(): boolean;
  clearAsOf(): TransactionProto;

  getIsLink(): boolean;
  setIsLink(value: boolean): TransactionProto;

  getPortfolio(): fintekkers_models_portfolio_portfolio_pb.PortfolioProto | undefined;
  setPortfolio(value?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto): TransactionProto;
  hasPortfolio(): boolean;
  clearPortfolio(): TransactionProto;

  getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
  setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): TransactionProto;
  hasSecurity(): boolean;
  clearSecurity(): TransactionProto;

  getTransactionType(): fintekkers_models_transaction_transaction_type_pb.TransactionTypeProto;
  setTransactionType(value: fintekkers_models_transaction_transaction_type_pb.TransactionTypeProto): TransactionProto;

  getQuantity(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
  setQuantity(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TransactionProto;
  hasQuantity(): boolean;
  clearQuantity(): TransactionProto;

  getPrice(): fintekkers_models_price_price_pb.PriceProto | undefined;
  setPrice(value?: fintekkers_models_price_price_pb.PriceProto): TransactionProto;
  hasPrice(): boolean;
  clearPrice(): TransactionProto;

  getTradeDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
  setTradeDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TransactionProto;
  hasTradeDate(): boolean;
  clearTradeDate(): TransactionProto;

  getSettlementDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
  setSettlementDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TransactionProto;
  hasSettlementDate(): boolean;
  clearSettlementDate(): TransactionProto;

  getChildtransactionsList(): Array<TransactionProto>;
  setChildtransactionsList(value: Array<TransactionProto>): TransactionProto;
  clearChildtransactionsList(): TransactionProto;
  addChildtransactions(value?: TransactionProto, index?: number): TransactionProto;

  getPositionStatus(): fintekkers_models_position_position_status_pb.PositionStatusProto;
  setPositionStatus(value: fintekkers_models_position_position_status_pb.PositionStatusProto): TransactionProto;

  getTradeName(): string;
  setTradeName(value: string): TransactionProto;

  getStrategyAllocation(): fintekkers_models_strategy_strategy_allocation_pb.StrategyAllocationProto | undefined;
  setStrategyAllocation(value?: fintekkers_models_strategy_strategy_allocation_pb.StrategyAllocationProto): TransactionProto;
  hasStrategyAllocation(): boolean;
  clearStrategyAllocation(): TransactionProto;

  getIsCancelled(): boolean;
  setIsCancelled(value: boolean): TransactionProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransactionProto.AsObject;
  static toObject(includeInstance: boolean, msg: TransactionProto): TransactionProto.AsObject;
  static serializeBinaryToWriter(message: TransactionProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransactionProto;
  static deserializeBinaryFromReader(message: TransactionProto, reader: jspb.BinaryReader): TransactionProto;
}

export namespace TransactionProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
    asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    isLink: boolean,
    portfolio?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto.AsObject,
    security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
    transactionType: fintekkers_models_transaction_transaction_type_pb.TransactionTypeProto,
    quantity?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    price?: fintekkers_models_price_price_pb.PriceProto.AsObject,
    tradeDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
    settlementDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
    childtransactionsList: Array<TransactionProto.AsObject>,
    positionStatus: fintekkers_models_position_position_status_pb.PositionStatusProto,
    tradeName: string,
    strategyAllocation?: fintekkers_models_strategy_strategy_allocation_pb.StrategyAllocationProto.AsObject,
    isCancelled: boolean,
  }
}

