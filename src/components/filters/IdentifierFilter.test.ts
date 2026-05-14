import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import IdentifierFilter from './IdentifierFilter.svelte';
import type { IdentifierTypeName } from '$lib/securityFilterTypes';

describe('IdentifierFilter', () => {
  test('renders the default type options with friendly labels', () => {
    // Order matches Identifier.getAllTypeNames() (proto-declaration
    // order). Ledger-models 0.2.5 added INDEX_NAME between SERIES_ID
    // and CASH (#268 server-side index resolver) — the filter picks
    // it up automatically via getAllTypeNames(); this expectation
    // tracks the proto.
    const { getAllByRole } = render(IdentifierFilter);
    const options = getAllByRole('option') as HTMLOptionElement[];
    expect(options.map((o) => o.value)).toEqual([
      'EXCH_TICKER',
      'ISIN',
      'CUSIP',
      'OSI',
      'FIGI',
      'SERIES_ID',
      'INDEX_NAME',
      'CASH',
    ]);
    expect(options.map((o) => o.text)).toEqual([
      'Ticker',
      'ISIN',
      'CUSIP',
      'OSI',
      'FIGI',
      'Series ID',
      'Index Name',
      'Cash',
    ]);
  });

  test('honors supportedTypes subset (e.g. prices uses only 4)', () => {
    const { getAllByRole } = render(IdentifierFilter, {
      props: {
        supportedTypes: ['CUSIP', 'ISIN', 'EXCH_TICKER', 'SERIES_ID'] as readonly IdentifierTypeName[],
      },
    });
    const values = (getAllByRole('option') as HTMLOptionElement[]).map((o) => o.value);
    expect(values).toEqual(['CUSIP', 'ISIN', 'EXCH_TICKER', 'SERIES_ID']);
  });

  test('placeholder reflects current identifierType', () => {
    const { getByLabelText, container } = render(IdentifierFilter, {
      props: { identifierType: 'EXCH_TICKER' as IdentifierTypeName, identifier: '' },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.placeholder).toBe('e.g. AAPL');
    // Just touch getByLabelText to assert select labeling works.
    expect(getByLabelText('Identifier type')).toBeInTheDocument();
  });

  test('clearOnTypeChange clears identifier when the dropdown changes', async () => {
    const { container } = render(IdentifierFilter, {
      props: {
        identifierType: 'CUSIP' as IdentifierTypeName,
        identifier: '912828ZT0',
      },
    });
    const select = container.querySelector('select') as HTMLSelectElement;
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.value).toBe('912828ZT0');
    await fireEvent.change(select, { target: { value: 'EXCH_TICKER' } });
    // Read the bound state via the DOM (component-instance reads require
    // `accessors: true` which we'd rather not opt into for one test).
    expect(input.value).toBe('');
  });

  test('clearOnTypeChange=false preserves the value when the type changes', async () => {
    const { container } = render(IdentifierFilter, {
      props: {
        identifierType: 'CUSIP' as IdentifierTypeName,
        identifier: '912828ZT0',
        clearOnTypeChange: false,
      },
    });
    const select = container.querySelector('select') as HTMLSelectElement;
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    await fireEvent.change(select, { target: { value: 'EXCH_TICKER' } });
    expect(input.value).toBe('912828ZT0');
  });

  test('dispatches typeChange event with the new type', async () => {
    const events: string[] = [];
    const { container, component } = render(IdentifierFilter, {
      props: { identifierType: 'CUSIP' as IdentifierTypeName, identifier: '' },
    });
    component.$on('typeChange', (e: CustomEvent<string>) => events.push(e.detail));
    const select = container.querySelector('select') as HTMLSelectElement;
    await fireEvent.change(select, { target: { value: 'ISIN' } });
    expect(events).toEqual(['ISIN']);
  });

  test('labels prop overrides defaults per-type', () => {
    const { getAllByRole } = render(IdentifierFilter, {
      props: {
        supportedTypes: ['CUSIP', 'EXCH_TICKER'] as readonly IdentifierTypeName[],
        labels: { EXCH_TICKER: 'Stock Symbol' },
      },
    });
    const options = (getAllByRole('option') as HTMLOptionElement[]).map((o) => o.text);
    expect(options).toEqual(['CUSIP', 'Stock Symbol']);
  });

  test('placeholders prop overrides default per-type', () => {
    const { container } = render(IdentifierFilter, {
      props: {
        identifierType: 'CUSIP' as IdentifierTypeName,
        placeholders: { CUSIP: 'custom hint' },
      },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.placeholder).toBe('custom hint');
  });
});
