import { describe, it, expect } from 'vitest';
import { createTermActivityGraph } from './treasury_graphs';
import type { TreasuryTransaction } from './treasury_positions';

describe('treasury_graphs - term activity', () => {
    it('buckets TENOR values into expected term categories', () => {
        const txns: TreasuryTransaction[] = [
            {
                IDENTIFIER: 'A',
                TRANSACTION_TYPE: 'BUY',
                TRADE_DATE: new Date('2024-01-15T00:00:00Z'),
                PRODUCT_TYPE: 'NOTE',
                TENOR: '2 years',
                DIRECTED_QUANTITY: 1_000_000_000,
            },
            {
                IDENTIFIER: 'B',
                TRANSACTION_TYPE: 'BUY',
                TRADE_DATE: new Date('2024-01-20T00:00:00Z'),
                PRODUCT_TYPE: 'NOTE',
                TENOR: '6 months',
                DIRECTED_QUANTITY: 2_000_000_000,
            },
            {
                IDENTIFIER: 'C',
                TRANSACTION_TYPE: 'BUY',
                TRADE_DATE: new Date('2024-02-01T00:00:00Z'),
                PRODUCT_TYPE: 'NOTE',
                TENOR: 'P2Y',
                DIRECTED_QUANTITY: 1_000_000_000,
            },
            {
                IDENTIFIER: 'D',
                TRANSACTION_TYPE: 'BUY',
                TRADE_DATE: new Date('2024-02-05T00:00:00Z'),
                PRODUCT_TYPE: 'NOTE',
                TENOR: '6M',
                DIRECTED_QUANTITY: 1_000_000_000,
            },
            {
                IDENTIFIER: 'E',
                TRANSACTION_TYPE: 'BUY',
                TRADE_DATE: new Date('2024-03-01T00:00:00Z'),
                PRODUCT_TYPE: 'NOTE',
                TENOR: 'TERM: 5Y1M4W1D',
                DIRECTED_QUANTITY: 1_000_000_000,
            },
        ];

        const graph = createTermActivityGraph(txns);
        expect(graph.data).toBeDefined();
        expect(graph.data.length).toBeGreaterThan(0);

        // The graph creates traces for fixed termCategories in order.
        // Ensure at least the relevant buckets have non-zero values somewhere.
        const tracesByName = new Map<string, any>(
            graph.data.map((t: any) => [t.name, t])
        );

        const bucket1 = tracesByName.get('>1 year - 3 years');
        const bucket2 = tracesByName.get('>3 months - 1 year');

        expect(bucket1).toBeTruthy();
        expect(bucket2).toBeTruthy();

        // Values are converted to billions in the graph
        expect(Math.max(...bucket1.y)).toBeGreaterThan(0);
        expect(Math.max(...bucket2.y)).toBeGreaterThan(0);
    });
});


