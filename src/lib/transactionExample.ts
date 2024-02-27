
import { LocalTimestampProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/local_timestamp_pb';
import * as ts from '@fintekkers/ledger-models/node/wrappers/services/transaction-service/TransactionService';
import * as datetime from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import * as positionFilter from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import type Transaction from '@fintekkers/ledger-models/node/wrappers/models/transaction/transaction';

const transactionService = new ts.TransactionService();
const now = datetime.ZonedDateTime.now();
const filter = new positionFilter.PositionFilter();

const results: Transaction[] = await transactionService.searchTransaction(now.toProto(), filter);

results.forEach(element => {
    console.log(element);
});
