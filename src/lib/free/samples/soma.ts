import { PortfolioService } from '@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;

const portfolios = new PortfolioService();
const [soma] = await portfolios.searchPortfolio(
  ZonedDateTime.now().toProto(),
  new PositionFilter().addEqualsFilter(
    FieldProto.PORTFOLIO_NAME, 'Federal Reserve SOMA Holdings')
);
console.log(soma.getPortfolioName());
