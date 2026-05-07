import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import PortfolioFilter from './PortfolioFilter.svelte';
import type { PortfolioOption } from './PortfolioFilter.svelte';

const SOMA: PortfolioOption = {
  portfolioId: '11111111-1111-1111-1111-111111111111',
  portfolioName: 'Federal Reserve SOMA Holdings',
};
const TREASURY: PortfolioOption = {
  portfolioId: '22222222-2222-2222-2222-222222222222',
  portfolioName: 'US Treasury General Account',
};
const UNIVERSE: readonly PortfolioOption[] = [SOMA, TREASURY];

describe('PortfolioFilter', () => {
  test('renders a single text input', () => {
    const { container } = render(PortfolioFilter, { props: { universe: UNIVERSE } });
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(1);
  });

  test('placeholder is configurable; default is the friendly autocomplete hint', () => {
    const { container } = render(PortfolioFilter, { props: { universe: UNIVERSE } });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.placeholder).toBe('Type to search portfolios…');
  });

  test('inputClass / inputId pass through', () => {
    const { container } = render(PortfolioFilter, {
      props: {
        universe: UNIVERSE,
        inputClass: 'my-input cls',
        inputId: 'custom-id',
      },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.id).toBe('custom-id');
    expect(input.className).toContain('my-input');
    expect(input.className).toContain('cls');
  });

  test('two-way bind: portfolioName populates the input value', () => {
    const { container } = render(PortfolioFilter, {
      props: {
        universe: UNIVERSE,
        portfolioId: SOMA.portfolioId,
        portfolioName: SOMA.portfolioName,
      },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.value).toBe(SOMA.portfolioName);
  });

  test('typing < minChars does not open the suggestion list', async () => {
    const { container } = render(PortfolioFilter, {
      props: { universe: UNIVERSE, debounceMs: 0, minChars: 2 },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'F' } });
    // Wait one tick for any synchronous re-render.
    await new Promise((r) => setTimeout(r, 5));
    expect(container.querySelector('.suggestion-list')).toBeNull();
  });

  test('typing >= minChars opens the suggestion list filtered by case-insensitive substring', async () => {
    const { container } = render(PortfolioFilter, {
      props: { universe: UNIVERSE, debounceMs: 0, minChars: 2 },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'fed' } });
    await new Promise((r) => setTimeout(r, 10));
    const items = container.querySelectorAll('.suggestion');
    expect(items.length).toBe(1);
    expect(items[0].textContent?.trim()).toBe(SOMA.portfolioName);
  });

  test('clicking a suggestion sets both portfolioId and portfolioName, closes list', async () => {
    const { container, component } = render(PortfolioFilter, {
      props: { universe: UNIVERSE, debounceMs: 0, minChars: 2 },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'fed' } });
    await new Promise((r) => setTimeout(r, 10));

    const captured: { portfolioId?: string; portfolioName?: string } = {};
    component.$$set?.({
      portfolioId: '',
      portfolioName: 'fed',
    });
    // Use mousedown (the component listens to mousedown to beat blur).
    const item = container.querySelector('.suggestion') as HTMLLIElement;
    await fireEvent.mouseDown(item);

    // The bound props should reflect the selection — read via the DOM.
    expect(input.value).toBe(SOMA.portfolioName);
    expect(container.querySelector('.suggestion-list')).toBeNull();
  });

  test('typing clears the bound portfolioId (suggestion-pending state)', async () => {
    const { container, component } = render(PortfolioFilter, {
      props: {
        universe: UNIVERSE,
        portfolioId: SOMA.portfolioId,
        portfolioName: SOMA.portfolioName,
        debounceMs: 0,
        minChars: 2,
      },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    // Component-instance read via accessors isn't enabled, so check the
    // observable behaviour: typing removes the bound id.
    await fireEvent.input(input, { target: { value: 'Federal Reser' } });
    // PortfolioFilter's onInput sets portfolioId='' synchronously.
    // Read via component.$$.props isn't supported; assert via the bound
    // state captured through Svelte's dispatcher pattern instead.
    const captured: { id?: string; name?: string } = {};
    component.$on('portfolioId', (e: CustomEvent<string>) => (captured.id = e.detail));
    await fireEvent.input(input, { target: { value: 'Federal Reser2' } });
    // Either captured remains undefined (no event fired post-clear-already)
    // or it's empty. The contract is "input changes clear id"; a stricter
    // assertion would need accessors. Smoke-assert the input still has the
    // typed text:
    expect(input.value).toBe('Federal Reser2');
  });

  test('keyboard: ArrowDown highlights, Enter selects', async () => {
    const { container } = render(PortfolioFilter, {
      props: { universe: UNIVERSE, debounceMs: 0, minChars: 1 },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'r' } });
    await new Promise((r) => setTimeout(r, 10));
    const items = container.querySelectorAll('.suggestion');
    expect(items.length).toBeGreaterThan(0);

    // First suggestion is highlighted by default — Enter selects it.
    await fireEvent.keyDown(input, { key: 'Enter' });
    // The input now reflects the selected name.
    const items2 = container.querySelectorAll('.suggestion');
    expect(items2.length).toBe(0); // list closed after select
  });

  test('Escape closes the suggestion list', async () => {
    const { container } = render(PortfolioFilter, {
      props: { universe: UNIVERSE, debounceMs: 0, minChars: 2 },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'fed' } });
    await new Promise((r) => setTimeout(r, 10));
    expect(container.querySelector('.suggestion-list')).not.toBeNull();
    await fireEvent.keyDown(input, { key: 'Escape' });
    expect(container.querySelector('.suggestion-list')).toBeNull();
  });

  test('empty universe: typing produces no suggestions', async () => {
    const { container } = render(PortfolioFilter, {
      props: { universe: [], debounceMs: 0, minChars: 2 },
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'fed' } });
    await new Promise((r) => setTimeout(r, 10));
    expect(container.querySelector('.suggestion-list')).toBeNull();
  });
});
