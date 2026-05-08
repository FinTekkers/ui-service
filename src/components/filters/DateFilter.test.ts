import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import DateFilter from './DateFilter.svelte';
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/wrappers/models/position/position_filter_operator';

// The wrapper is the source of truth for both the runtime list and
// proto-name validation; the dropdown renders names verbatim
// (#229 review: no UI-side label map).
const ALL_OPS = PositionFilterOperator.getAllTypeNames();

describe('DateFilter', () => {
  test('renders both date input and operator select by default (withOperator=true)', () => {
    const { container } = render(DateFilter);
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(container.querySelector('select')).toBeInTheDocument();
  });

  test('withOperator=false hides the operator select', () => {
    const { container } = render(DateFilter, { props: { withOperator: false } });
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(container.querySelector('select')).toBeNull();
  });

  test('operator select is disabled when date is empty', () => {
    const { container } = render(DateFilter);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  test('operator select is enabled once a date is set', () => {
    const { container } = render(DateFilter, { props: { date: '2026-05-06' } });
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.disabled).toBe(false);
  });

  test('default options come from PositionFilterOperator.getAllTypeNames() — full set, proto names verbatim', () => {
    const { container } = render(DateFilter, { props: { date: '2026-05-06' } });
    const options = Array.from(container.querySelectorAll('option')) as HTMLOptionElement[];
    // Placeholder + every wrapper-known operator. Adding a new entry
    // upstream propagates here automatically.
    expect(options.map((o) => o.value)).toEqual(['', ...ALL_OPS]);
    // Display labels are the proto names verbatim — no UI-owned
    // friendly map (per #229 review, descriptions belong upstream).
    expect(options.map((o) => o.text)).toEqual(['Select operator...', ...ALL_OPS]);
    // Sanity: the wrapper's set must include the operators currently
    // referenced from positions.ts / transactions.ts / security.ts.
    expect(ALL_OPS).toEqual(expect.arrayContaining([
      'EQUALS', 'LESS_THAN', 'LESS_THAN_OR_EQUALS', 'MORE_THAN',
    ]));
  });

  test('operators prop restricts the dropdown to a subset', () => {
    const { container } = render(DateFilter, {
      props: {
        date: '2026-05-06',
        operators: ['MORE_THAN'] as readonly string[],
      },
    });
    const operatorOptions = (Array.from(container.querySelectorAll('option')) as HTMLOptionElement[])
      .filter((o) => o.value !== '');
    expect(operatorOptions.map((o) => o.value)).toEqual(['MORE_THAN']);
  });

  test('two-way bind: changing the date input propagates to the bound value', async () => {
    const { container } = render(DateFilter, { props: { date: '' } });
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '2026-05-06' } });
    expect(input.value).toBe('2026-05-06');
  });

  test('two-way bind: changing operator propagates', async () => {
    const { container } = render(DateFilter, {
      props: { date: '2026-05-06', operator: '' },
    });
    const select = container.querySelector('select') as HTMLSelectElement;
    await fireEvent.change(select, { target: { value: 'LESS_THAN_OR_EQUALS' } });
    expect(select.value).toBe('LESS_THAN_OR_EQUALS');
  });

  test('inputClass / selectClass / inputId pass through to the rendered nodes', () => {
    const { container } = render(DateFilter, {
      props: {
        date: '2026-05-06',
        inputClass: 'custom-input cls',
        selectClass: 'custom-select cls',
        inputId: 'my-date',
      },
    });
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    const select = container.querySelector('select') as HTMLSelectElement;
    // Svelte appends a scope hash to the className. Just assert the
    // pass-through tokens are present, not the exact string.
    expect(input.className).toContain('custom-input');
    expect(input.className).toContain('cls');
    expect(input.id).toBe('my-date');
    expect(select.className).toContain('custom-select');
    expect(select.className).toContain('cls');
  });
});
