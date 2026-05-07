import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import DateFilter from './DateFilter.svelte';
import type { DateOperator } from './DateFilter.svelte';

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

  test('default operators render in declared order with friendly labels', () => {
    const { container } = render(DateFilter, { props: { date: '2026-05-06' } });
    const options = Array.from(container.querySelectorAll('option')) as HTMLOptionElement[];
    // Values are proto enum names per #229; labels stay friendly.
    expect(options.map((o) => o.value)).toEqual([
      '',
      'MORE_THAN',
      'LESS_THAN',
      'LESS_THAN_OR_EQUALS',
    ]);
    expect(options.map((o) => o.text)).toEqual([
      'Select operator...',
      'Greater than',
      'Less than',
      'Less than or equals',
    ]);
  });

  test('operators prop restricts the dropdown to a subset', () => {
    const { container } = render(DateFilter, {
      props: {
        date: '2026-05-06',
        operators: ['MORE_THAN'] as readonly DateOperator[],
      },
    });
    const operatorOptions = (Array.from(container.querySelectorAll('option')) as HTMLOptionElement[])
      .filter((o) => o.value !== '');
    expect(operatorOptions.map((o) => o.value)).toEqual(['MORE_THAN']);
  });

  test('operatorLabels prop overrides specific operator labels', () => {
    const { container } = render(DateFilter, {
      props: {
        date: '2026-05-06',
        operatorLabels: { MORE_THAN: 'After' },
      },
    });
    const greaterThanOption = (Array.from(container.querySelectorAll('option')) as HTMLOptionElement[])
      .find((o) => o.value === 'MORE_THAN');
    expect(greaterThanOption?.text).toBe('After');
  });

  test('two-way bind: changing the date input propagates to the bound value', async () => {
    const { container } = render(DateFilter, { props: { date: '' } });
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '2026-05-06' } });
    expect(input.value).toBe('2026-05-06');
  });

  test('two-way bind: changing operator propagates', async () => {
    const { container } = render(DateFilter, {
      props: { date: '2026-05-06', operator: '' as DateOperator | '' },
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
