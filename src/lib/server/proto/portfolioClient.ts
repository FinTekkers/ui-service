import { PortfolioClient } from '@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb';
import grpc from '@grpc/grpc-js';

const credentials = grpc.credentials.createSsl();
const portfolioClient = new PortfolioClient('api.fintekkers.org:8082', credentials);

export default portfolioClient;
