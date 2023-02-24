import { QueryPortfolioRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/portfolio/query_portfolio_request_pb';
import type { QueryPortfolioResponseProto } from '@fintekkers/ledger-models/node/fintekkers/requests/portfolio/query_portfolio_response_pb';
import type { ServiceError } from '@grpc/grpc-js';
import { error } from '@sveltejs/kit';
import portfolioClient from '../../lib/server/proto/portfolioClient';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const response = await new Promise<{
		resp: QueryPortfolioResponseProto;
		err: ServiceError | null;
	}>((resolve, reject) => {
		const req = new QueryPortfolioRequestProto();

		portfolioClient.listIDs(req, (err, resp) => {
			resolve({ resp, err });
		});
	});

	if (response.err !== null) {
		console.log(response.err);
		throw error(500);
	}

	const portfolioData = response.resp.toObject().portfolioResponseList.map((p, idx) => {
		return {
			portfolio: p.portfolioName,
			portfolioId: p.uuid?.rawUuid.toString(),
			id: String(idx)
		};
	});

	return { portfolioData };
}
