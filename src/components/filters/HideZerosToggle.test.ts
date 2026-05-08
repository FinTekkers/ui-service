import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import HideZerosToggle from './HideZerosToggle.svelte';

describe('HideZerosToggle', () => {
  test('renders an unchecked checkbox by default', () => {
    const { container } = render(HideZerosToggle);
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);
  });

  test('value=true initializes the checkbox as checked', () => {
    const { container } = render(HideZerosToggle, { props: { value: true } });
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test('default label reads "Hide zero values"', () => {
    const { container } = render(HideZerosToggle);
    expect(container.textContent).toContain('Hide zero values');
  });

  test('label prop overrides the default text', () => {
    const { container } = render(HideZerosToggle, { props: { label: 'Hide zeros' } });
    expect(container.textContent).toContain('Hide zeros');
    expect(container.textContent).not.toContain('Hide zero values');
  });

  test('id prop reaches the input element (label htmlFor association)', () => {
    const { container } = render(HideZerosToggle, { props: { id: 'custom-toggle' } });
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.id).toBe('custom-toggle');
    const label = container.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe('custom-toggle');
  });

  test('two-way bind: clicking the checkbox flips the bound value', async () => {
    const { container } = render(HideZerosToggle, { props: { value: false } });
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });
});
