// Display formatting for the Free data explorer's mock figures. Formatting
// only: every number shown is stored in src/lib/free/mock/.

const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

/** 6471.1 → "6,471.1". */
export function formatOneDecimal(value: number): string {
  return value.toLocaleString("en-US", ONE_DECIMAL);
}

/** 185.3 → "+185.3", -30.2 → "−30.2" (U+2212), 0 → "0.0". */
export function formatChange(value: number): string {
  if (value > 0) return `+${formatOneDecimal(value)}`;
  if (value < 0) return `−${formatOneDecimal(-value)}`;
  return formatOneDecimal(0);
}

export type ChangeDirection = "up" | "down" | "flat";

export function changeDirection(value: number): ChangeDirection {
  return value > 0 ? "up" : value < 0 ? "down" : "flat";
}

/** $ millions → the artboard's $ billions label: 0 → "$0", 8 → "$0.01B",
 * 1625316 → "$1,625.3B". */
export function formatMillionsAsBillions(millions: number): string {
  if (millions === 0) return "$0";
  const billions = millions / 1000;
  if (billions < 1) return `$${billions.toFixed(2)}B`;
  return `$${billions.toLocaleString("en-US", ONE_DECIMAL)}B`;
}
