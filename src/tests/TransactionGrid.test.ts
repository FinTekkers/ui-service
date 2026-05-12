import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import TransactionGrid from '../components/widgets/TransactionGrid.svelte';
import type { TransactionData } from '../lib/transactions';

// M6 #263 bug 4: /data/transactions previously gave no indication which
// portfolio each row belonged to. TransactionGrid now renders a 'Portfolio'
// column (name) and a 'Portfolio ID' column (compact UUID, click-to-expand).

const portfolioAUuid = '11111111-2222-3333-4444-555555555555';
const portfolioBUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function row(overrides: Partial<TransactionData> = {}): TransactionData {
  return {
    transactionId: 'TXN-1',
    uuidHex: 'deadbeef',
    transactionPortfolioId: portfolioAUuid,
    transactionPortfolioName: 'Growth Fund',
    transactionSettlementDate: '2026-05-12',
    transactionIssuerName: 'Treasury',
    transactionIssueDate: '2026-01-01',
    transactionQuantity: '1000',
    transactionProductType: 'TREASURY_NOTE',
    transactionTenor: '10Y',
    transactionCouponFrequency: 'SEMI_ANNUAL',
    transactionCouponRate: '0.045',
    transactionCouponType: 'FIXED',
    transactionMaturityDate: '2036-01-01',
    transactionTradeDate: '2026-05-10',
    transactionSide: 'BUY',
    transactionPrice: '100',
    ...overrides,
  };
}

describe('TransactionGrid portfolio columns (M6 #263 bug 4)', () => {
  test('renders Portfolio and Portfolio ID column headers', () => {
    render(TransactionGrid, { props: { rows: [row()] } });
    const headers = screen.getAllByRole('button').map((h) => h.textContent?.trim());
    expect(headers).toContain('Portfolio');
    expect(headers).toContain('Portfolio ID');
  });

  test('renders the portfolio name in every row', () => {
    render(TransactionGrid, {
      props: {
        rows: [
          row({ transactionId: 'TXN-A', transactionPortfolioName: 'Growth Fund' }),
          row({ transactionId: 'TXN-B', transactionPortfolioName: 'Income Fund', transactionPortfolioId: portfolioBUuid }),
        ],
      },
    });
    expect(screen.getByText('Growth Fund')).toBeInTheDocument();
    expect(screen.getByText('Income Fund')).toBeInTheDocument();
  });

  test('Portfolio ID displays compact (first 8 hex chars + …) by default', () => {
    render(TransactionGrid, { props: { rows: [row()] } });
    // First 8 chars of portfolioAUuid: '11111111'
    const toggle = screen.getByRole('button', { name: /^11111111…$/ });
    expect(toggle).toBeInTheDocument();
    expect(toggle.getAttribute('title')).toBe(portfolioAUuid);
  });

  test('clicking the compact Portfolio ID expands to the full UUID', async () => {
    render(TransactionGrid, { props: { rows: [row()] } });
    const toggle = screen.getByRole('button', { name: /^11111111…$/ });
    await fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: portfolioAUuid })).toBeInTheDocument();
  });

  test('clicking expanded Portfolio ID collapses it back to compact', async () => {
    render(TransactionGrid, { props: { rows: [row()] } });
    const compact = screen.getByRole('button', { name: /^11111111…$/ });
    await fireEvent.click(compact);
    const expanded = screen.getByRole('button', { name: portfolioAUuid });
    await fireEvent.click(expanded);
    expect(screen.getByRole('button', { name: /^11111111…$/ })).toBeInTheDocument();
  });

  test('rows that share a portfolioId expand together (toggle keyed by id)', async () => {
    render(TransactionGrid, {
      props: {
        rows: [
          row({ transactionId: 'TXN-A' }),
          row({ transactionId: 'TXN-B' }),
        ],
      },
    });
    const compactToggles = screen.getAllByRole('button', { name: /^11111111…$/ });
    expect(compactToggles).toHaveLength(2);
    await fireEvent.click(compactToggles[0]);
    expect(screen.getAllByRole('button', { name: portfolioAUuid })).toHaveLength(2);
  });

  test('missing portfolioId renders no toggle button (empty cell)', () => {
    render(TransactionGrid, {
      props: { rows: [row({ transactionPortfolioId: '', transactionPortfolioName: '' })] },
    });
    expect(screen.queryByRole('button', { name: /…/ })).toBeNull();
  });
});
