import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, test, beforeEach } from 'vitest';
import PortfolioGrid from '../components/widgets/PortfolioGrid.svelte';

const mockRows = [
	{
		portfolioName: 'Growth Fund',
		portfolioId: 'portfolio-001',
		portfolioAsOf: '2025-06-15',
	},
	{
		portfolioName: 'Income Fund',
		portfolioId: 'portfolio-002',
		portfolioAsOf: '2025-07-01',
	},
	{
		portfolioName: 'Balanced Fund',
		portfolioId: 'portfolio-003',
		portfolioAsOf: '2025-05-20',
	},
];

describe('PortfolioGrid', () => {
	beforeEach(() => {
		render(PortfolioGrid, { props: { rows: mockRows } });
	});

	test('renders the Portfolios heading', () => {
		expect(screen.getByText('Portfolios')).toBeInTheDocument();
	});

	test('renders all portfolio rows with correct data', () => {
		for (const row of mockRows) {
			expect(screen.getByText(row.portfolioName)).toBeInTheDocument();
			expect(screen.getByText(row.portfolioId)).toBeInTheDocument();
			expect(screen.getByText(row.portfolioAsOf)).toBeInTheDocument();
		}
	});

	test('renders column headers for Portfolio, ID, and Created (AsOf)', () => {
		const headers = screen.getAllByRole('button');
		const headerTexts = headers.map((h) => h.textContent?.trim());
		expect(headerTexts).toContain('Portfolio');
		expect(headerTexts).toContain('ID');
		expect(headerTexts).toContain('Created (AsOf)');
	});

	test('each row contains links with the correct positions URL', () => {
		const links = screen.getAllByRole('link');

		for (const row of mockRows) {
			const expectedParams = new URLSearchParams({
				portfolioId: row.portfolioId,
				fields: 'SECURITY_DESCRIPTION,PORTFOLIO_NAME',
				measures: 'DIRECTED_QUANTITY,MARKET_VALUE',
				positionView: 'DEFAULT_VIEW',
				positionType: 'TAX_LOT',
			});
			const expectedUrl = `/data/positions?${expectedParams.toString()}`;

			// Find links for this row (3 links per row: one per column)
			const rowLinks = links.filter(
				(link) => link.getAttribute('href') === expectedUrl
			);
			expect(rowLinks.length).toBe(3); // one link per column cell
		}
	});

	test('links include required query parameters: portfolioId, fields, measures, positionView, positionType', () => {
		const links = screen.getAllByRole('link');
		// Check the first link for portfolio-001
		const firstLink = links.find((l) =>
			l.getAttribute('href')?.includes('portfolio-001')
		);
		expect(firstLink).toBeTruthy();

		const href = firstLink!.getAttribute('href')!;
		const params = new URLSearchParams(href.split('?')[1]);

		expect(params.get('portfolioId')).toBe('portfolio-001');
		expect(params.get('fields')).toBe('SECURITY_DESCRIPTION,PORTFOLIO_NAME');
		expect(params.get('measures')).toBe('DIRECTED_QUANTITY,MARKET_VALUE');
		expect(params.get('positionView')).toBe('DEFAULT_VIEW');
		expect(params.get('positionType')).toBe('TAX_LOT');
	});

	test('clicking a column header triggers sorting', async () => {
		const idHeader = screen.getByText(/^ID/);
		await fireEvent.click(idHeader);

		// After clicking ID header ascending, rows should be in ID order
		const allCells = screen.getAllByRole('link');
		// Extract text from links - every 3rd link starting at index 1 is the ID column
		const idTexts = allCells
			.filter((_, i) => i % 3 === 1)
			.map((el) => el.textContent);

		expect(idTexts).toEqual([
			'portfolio-001',
			'portfolio-002',
			'portfolio-003',
		]);

		// Click again to reverse sort
		await fireEvent.click(idHeader);
		const allCellsAfter = screen.getAllByRole('link');
		const idTextsDesc = allCellsAfter
			.filter((_, i) => i % 3 === 1)
			.map((el) => el.textContent);

		expect(idTextsDesc).toEqual([
			'portfolio-003',
			'portfolio-002',
			'portfolio-001',
		]);
	});

	test('renders correct number of table rows (excluding header)', () => {
		const rows = screen.getAllByRole('row');
		// 1 header row + 3 data rows
		expect(rows.length).toBe(4);
	});
});

describe('PortfolioGrid with empty rows', () => {
	test('renders table with no data rows when rows is empty', () => {
		render(PortfolioGrid, { props: { rows: [] } });
		const rows = screen.getAllByRole('row');
		// Only the header row
		expect(rows.length).toBe(1);
	});
});
