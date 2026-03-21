/**
 * Tests for the "Back to Portfolios" link behavior on the positions page.
 *
 * The positions page (+page.svelte) conditionally renders a "Back to Portfolios"
 * link when `data.portfolioId` is present. Since the full page component has
 * many heavy dependencies (DashboardSideBar, PositionGrid, PositionSelect, etc.),
 * we test the conditional rendering logic using a minimal test harness component
 * that mirrors the relevant template logic.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import BackLinkTestHarness from './BackLinkTestHarness.svelte';

describe('Positions page - Back to Portfolios link', () => {
	test('renders "Back to Portfolios" link when portfolioId is present', () => {
		render(BackLinkTestHarness, {
			props: { portfolioId: 'portfolio-123' },
		});

		const backLink = screen.getByText(/Back to Portfolios/);
		expect(backLink).toBeInTheDocument();
		expect(backLink.closest('a')).toHaveAttribute(
			'href',
			'/(authenticated)/data/portfolios'
		);
	});

	test('does NOT render "Back to Portfolios" link when portfolioId is null', () => {
		render(BackLinkTestHarness, {
			props: { portfolioId: null },
		});

		expect(screen.queryByText(/Back to Portfolios/)).not.toBeInTheDocument();
	});

	test('does NOT render "Back to Portfolios" link when portfolioId is undefined', () => {
		render(BackLinkTestHarness, {
			props: {},
		});

		expect(screen.queryByText(/Back to Portfolios/)).not.toBeInTheDocument();
	});
});
