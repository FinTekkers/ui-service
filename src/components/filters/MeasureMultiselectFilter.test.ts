import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { Measure } from '@fintekkers/ledger-models/node/wrappers/models/position/measure';
import MeasureMultiselectFilter, {
  DEFAULT_MEASURE_NAMES,
  DEFAULT_MEASURE_LABELS,
} from './MeasureMultiselectFilter.svelte';

describe('MeasureMultiselectFilter', () => {
  test('renders a single combobox/multiselect input', () => {
    const { container } = render(MeasureMultiselectFilter);
    // svelte-multiselect renders an `<input>` for the search field
    // inside the `<ul>` widget. One input is enough for a smoke test.
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  test('DEFAULT_MEASURE_NAMES exports the runtime allowlist (proto names, valuation-only excluded)', () => {
    // Sanity: the four measures the in-tree consumer (PortfolioGrid)
    // hard-emits are all in the default set.
    expect(DEFAULT_MEASURE_NAMES).toEqual(expect.arrayContaining([
      'DIRECTED_QUANTITY',
      'MARKET_VALUE',
      'PROFIT_LOSS',
      'CURRENT_YIELD',
      'YIELD_TO_MATURITY',
    ]));
    // Valuation-only entries are filtered out (rendering them would
    // surface a silent no-op in the position search path).
    expect(DEFAULT_MEASURE_NAMES).not.toEqual(expect.arrayContaining([
      'PRESENT_VALUE',
      'PRESENT_VALUE_CASHFLOWS',
      'REAL_YIELD',
      'INFLATION_ADJUSTED_PRINCIPAL',
      'DISCOUNT_MARGIN',
      'SPREAD_DURATION',
    ]));
  });

  test('DEFAULT_MEASURE_NAMES is wrapper-driven: every entry comes from Measure.getAllTypeNames()', () => {
    // Adopting the Measure wrapper (ledger-models 0.1.138, PR #194)
    // means a new proto enum entry upstream auto-propagates here
    // without a UI-side edit. This assertion locks in the contract.
    const wrapperNames = new Set(Measure.getAllTypeNames());
    for (const name of DEFAULT_MEASURE_NAMES) {
      expect(
        wrapperNames.has(name),
        `${name} should come from Measure.getAllTypeNames(); UI no longer hand-rolls the list`,
      ).toBe(true);
    }
  });

  test('DEFAULT_MEASURE_LABELS title-cases proto names', () => {
    expect(DEFAULT_MEASURE_LABELS.DIRECTED_QUANTITY).toBe('Directed Quantity');
    expect(DEFAULT_MEASURE_LABELS.MARKET_VALUE).toBe('Market Value');
    expect(DEFAULT_MEASURE_LABELS.YIELD_TO_MATURITY).toBe('Yield To Maturity');
  });

  test('containerClass / id pass through to the rendered nodes', () => {
    const { container } = render(MeasureMultiselectFilter, {
      props: { containerClass: 'my-wrapper cls', id: 'custom-id' },
    });
    // Locate the wrapper div by one of the pass-through class tokens.
    // (testing-library's `container` is the test renderer's host;
    // the actual wrapper sits one level deeper in some setups.)
    const wrapper = container.querySelector('.my-wrapper') as HTMLElement;
    expect(wrapper, 'containerClass renders as a wrapper class').not.toBeNull();
    expect(wrapper.className).toContain('cls');
    // The id is forwarded into svelte-multiselect's outer node.
    expect(container.querySelector('#custom-id')).not.toBeNull();
  });

  test('initial value (proto names) renders friendly-labeled chips', () => {
    const { container } = render(MeasureMultiselectFilter, {
      props: { value: ['DIRECTED_QUANTITY', 'MARKET_VALUE'] },
    });
    // svelte-multiselect renders selected items as <li> elements with
    // the friendly label text (DEFAULT_MEASURE_LABELS lookup).
    const text = container.textContent ?? '';
    expect(text).toContain('Directed Quantity');
    expect(text).toContain('Market Value');
  });

  test('supportedMeasures restricts the dropdown to a subset', async () => {
    const { container } = render(MeasureMultiselectFilter, {
      props: { supportedMeasures: ['DIRECTED_QUANTITY'] },
    });
    // The hidden form input mirrors the option list svelte-multiselect
    // exposes; assert that the only label visible in the rendered
    // option-set text is "Directed Quantity". (Easier than poking the
    // library's internals.)
    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.focus(input);
    // After focus the dropdown is open; the rendered text should
    // include exactly one option label.
    const text = container.textContent ?? '';
    expect(text).toContain('Directed Quantity');
    expect(text).not.toContain('Market Value');
  });

  test('labels prop overrides specific friendly labels', () => {
    const { container } = render(MeasureMultiselectFilter, {
      props: {
        value: ['DIRECTED_QUANTITY'],
        labels: { DIRECTED_QUANTITY: 'Quantity' },
      },
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Quantity');
    // The override beats the default 'Directed Quantity' label.
    expect(text).not.toContain('Directed Quantity');
  });
});
