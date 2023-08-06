<script   >
import { onMount } from "svelte";

import { PortfolioProto } from '@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb';
import { LocalTimestampProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/local_timestamp_pb';

// Portfolio Response Service
import grpc from '@grpc/grpc-js';
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { CreatePortfolioRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/portfolio/create_portfolio_request_pb";
import { QueryPortfolioRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/portfolio/query_portfolio_request_pb";
import { PortfolioService } from '@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService';


// import { LocalTimestampProto } from '../../../node/fintekkers/models/util/local_timestamp_pb';
// import { CreatePortfolioRequestProto } from '../../../node/fintekkers/requests/portfolio/create_portfolio_request_pb';
// import { QueryPortfolioRequestProto } from '../../../node/fintekkers/requests/portfolio/query_portfolio_request_pb';

// import { PortfolioClient } from '../../../node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
	import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
// import { UUID } from '../../../proto_utils_uuid';

let data;

function createTimestampWithCurrentTime() {
  const currentTimeMillis = Date.now();
  const seconds = Math.floor(currentTimeMillis / 1000);
  const nanos = (currentTimeMillis % 1000) * 1e6;
  const timestamp = new Timestamp();
  timestamp.setSeconds(seconds);
  timestamp.setNanos(nanos);
  return timestamp;
}

const receivedBytes = [-39, 98, -3, -16, 51, -31, 77, -99, -103, -101, 126, -61, 80, -16, -53, 119];
const id_proto = new UUID(receivedBytes).toUUIDProto();

const now = new LocalTimestampProto();
now.setTimeZone('America/New_York');
now.setTimestamp(createTimestampWithCurrentTime());

const portfolio = new PortfolioProto();
portfolio.setObjectClass('Portfolio');
portfolio.setVersion('0.0.1');
portfolio.setUuid(id_proto);
portfolio.setPortfolioName('TEST PORTFOLIO');
portfolio.setAsOf(now);

const client = new PortfolioService();

async function validateCreateOrUpdate() {
  client.validateCreatePortfolio(portfolio).then(response => {
    console.log('Result of the validation request:');
    console.log('Response:', response);
  }).catch(error => {
    console.error('Error:', error?.message);
  });
}

async function createOrUpdate() {
  client.createPortfolio(portfolio).then(response => {
    console.log('Result of the create/update call');
    console.log('Response:', response);
  }).catch(error => {
    console.error('Error:', error?.message);
  });
}

client.searchPortfolio(
  now, FieldProto.PORTFOLIO_NAME, 'TEST PORTFOLIO' 
).then(response => {
  console.log('Result of the search request:');
  console.log('Response:', response);
}).catch(error => {
  console.error('Error:', error?.message);
});


</script>