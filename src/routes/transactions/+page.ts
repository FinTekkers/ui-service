/** @type {import('./$types').PageLoad} */
export function load() {
	//TODO: add api call here
	return {
		rows: [...Array(100).keys()].map((i) => {
			return {
				id: String(i),
				portfolio: 'Sam S.',
				security: 'APPL',
				transactionType: 'BUY',
				quantity: 23,
				price: 148.48,
				tradeDate: '02/21/2023',
				settlementDate: '02/21/2023'
			};
		})
	};
}
