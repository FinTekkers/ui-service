import { SecurityService } from '@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;

// Run with your free API key (Pro register/login) as the first argument.
const securities = new SecurityService(process.argv[2]);
const [tips] = await securities.searchSecurity(
  ZonedDateTime.now().toProto(),
  new PositionFilter().addEqualsFilter(FieldProto.IDENTIFIER, '91282CPU9')
);
if (tips.isBond()) {
  console.log(tips.getCouponRate(), tips.getMaturityDate());
}
