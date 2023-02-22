/** @type {import('./$types').PageLoad} */
export function load() {
	//TODO: add api call here
	return {
		rows: [...Array(100).keys()].map((i) => {
			if (i % 2 === 0) {
				return { portfolio: 'Sam S.', portfolioId: i, id: i };
			}
			return { portfolio: 'Dave D.', portfolioId: i, id: i };
		})
	};
}
