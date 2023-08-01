<script   >
import { onMount } from "svelte";
import { PortfolioProto } from '../../../node/fintekkers/models/portfolio/portfolio_pb';
import { LocalTimestampProto } from '../../../node/fintekkers/models/util/local_timestamp_pb';
import { CreatePortfolioRequestProto } from '../../../node/fintekkers/requests/portfolio/create_portfolio_request_pb';
import { QueryPortfolioRequestProto } from '../../../node/fintekkers/requests/portfolio/query_portfolio_request_pb';

import { PortfolioClient } from '../../../node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { UUID } from '../../../proto_utils_uuid';

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
const id_proto = new UUID(receivedBytes).to_uuid_proto();

const now = new LocalTimestampProto();
now.setTimeZone('America/New_York');
now.setTimestamp(createTimestampWithCurrentTime());

const portfolio = new PortfolioProto();
portfolio.setObjectClass('Portfolio');
portfolio.setVersion('0.0.1');
portfolio.setUuid(id_proto);
portfolio.setPortfolioName('TEST PORTFOLIO');
portfolio.setAsOf(now);

const createRequest = new CreatePortfolioRequestProto();
createRequest.setObjectClass('PortfolioRequest');
createRequest.setVersion('0.0.1');
createRequest.setCreatePortfolioInput(portfolio);

const searchRequest = new QueryPortfolioRequestProto();
searchRequest.setObjectClass('PortfolioRequest');
searchRequest.setVersion('0.0.1');
searchRequest.setAsOf(now);
searchRequest.addUuids(id_proto);

// Portfolio Response Service
import grpc from '@grpc/grpc-js';

const client = new PortfolioClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
// const client = new PortfolioClient('localhost:8082', grpc.credentials.createInsecure());

async function validateCreateOrUpdate() {
  try {
    const response = await new Promise((resolve, reject) => {
      client.validateCreateOrUpdate(createRequest, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
    console.log('Result of the validation request:');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error?.message);
  }
}

async function createOrUpdate() {
  try {
    const response = await new Promise((resolve, reject) => {
      client.createOrUpdate(createRequest, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
    console.log('Result of the create/update call');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const stream = client.search(searchRequest);

// Handle the stream of responses
stream.on('data', response => {
  console.log('Result of the search call');
  console.log('Response:', response);
});

stream.on('end', () => {
  console.log('Stream ended.');
});

stream.on('error', err => {
  console.error('Error in the stream:', err);
});


</script>