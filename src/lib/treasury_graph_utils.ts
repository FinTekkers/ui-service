import type { TreasuryTransaction } from './treasury_positions';

/**
 * Groups transactions by date and a category field, then sums DIRECTED_QUANTITY
 * Equivalent to pandas groupby().sum()
 */
export function groupByDateAndCategory(
  transactions: TreasuryTransaction[],
  category:
    | 'TRANSACTION_TYPE'
    | 'PRODUCT_TYPE'
    | 'ADJUSTED_TENOR'
    | ((txn: TreasuryTransaction) => string)
): Map<string, Map<string, number>> {
  const grouped = new Map<string, Map<string, number>>();

  for (const txn of transactions) {
    const dateKey = txn.TRADE_DATE.toISOString().split('T')[0]; // YYYY-MM-DD
    const categoryValue =
      typeof category === 'function'
        ? category(txn)
        : String((txn as any)[category] || '');
    const categoryKey = String(categoryValue || '');

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, new Map());
    }

    const categoryMap = grouped.get(dateKey)!;
    const currentValue = categoryMap.get(categoryKey) || 0;
    categoryMap.set(categoryKey, currentValue + txn.DIRECTED_QUANTITY);
  }

  return grouped;
}

/**
 * Resamples data to weekly intervals
 * Groups dates by week (Monday as start of week) and sums values
 */
export function resampleWeekly(
  data: Map<string, Map<string, number>>
): Map<string, Map<string, number>> {
  const weekly = new Map<string, Map<string, number>>();

  for (const [dateStr, categoryMap] of data.entries()) {
    const date = new Date(dateStr + 'T00:00:00'); // Ensure consistent timezone
    // Get Monday of the week
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().split('T')[0];

    if (!weekly.has(weekKey)) {
      weekly.set(weekKey, new Map());
    }

    const weekCategoryMap = weekly.get(weekKey)!;
    for (const [category, value] of categoryMap.entries()) {
      const currentValue = weekCategoryMap.get(category) || 0;
      weekCategoryMap.set(category, currentValue + value);
    }
  }

  return weekly;
}

/**
 * Resamples data to monthly intervals
 * Groups dates by month and sums values
 */
export function resampleMonthly(
  data: Map<string, Map<string, number>>
): Map<string, Map<string, number>> {
  const monthly = new Map<string, Map<string, number>>();

  for (const [dateStr, categoryMap] of data.entries()) {
    const date = new Date(dateStr + 'T00:00:00'); // Ensure consistent timezone
    // Get first day of the month
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

    if (!monthly.has(monthKey)) {
      monthly.set(monthKey, new Map());
    }

    const monthCategoryMap = monthly.get(monthKey)!;
    for (const [category, value] of categoryMap.entries()) {
      const currentValue = monthCategoryMap.get(category) || 0;
      monthCategoryMap.set(category, currentValue + value);
    }
  }

  return monthly;
}

/**
 * Converts grouped data to a pivot table format
 * Returns an object with dates as keys and category values as nested objects
 */
export function pivotTable(
  grouped: Map<string, Map<string, number>>
): Record<string, Record<string, number>> {
  const pivot: Record<string, Record<string, number>> = {};

  for (const [date, categoryMap] of grouped.entries()) {
    pivot[date] = {};
    for (const [category, value] of categoryMap.entries()) {
      pivot[date][category] = value;
    }
  }

  return pivot;
}

/**
 * Calculates moving average for a series of values
 */
export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
    } else {
      const slice = values.slice(i - window + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }

  return result;
}

/**
 * Calculates cumulative sum for each category over time
 */
export function cumulativeSum(
  pivot: Record<string, Record<string, number>>,
  sortedDates: string[]
): Record<string, Record<string, number>> {
  const cumulative: Record<string, Record<string, number>> = {};
  const runningTotals: Record<string, number> = {};

  // Collect union of all categories across all dates so we can forward-fill
  const allCategories = new Set<string>();
  for (const row of Object.values(pivot)) {
    for (const category of Object.keys(row)) {
      allCategories.add(category);
    }
  }

  for (const date of sortedDates) {
    cumulative[date] = {};
    const currentRow = pivot[date] || {};

    // Update and forward-fill for every category
    for (const category of allCategories) {
      const increment = currentRow[category] ?? 0;
      runningTotals[category] = (runningTotals[category] || 0) + increment;
      cumulative[date][category] = runningTotals[category];
    }
  }

  return cumulative;
}

/**
 * Filters data to only include dates >= startDate
 */
export function filterByStartDate(
  pivot: Record<string, Record<string, number>>,
  startDate: string
): Record<string, Record<string, number>> {
  const filtered: Record<string, Record<string, number>> = {};
  const start = new Date(startDate);

  for (const [date, values] of Object.entries(pivot)) {
    const dateObj = new Date(date);
    if (dateObj >= start) {
      filtered[date] = values;
    }
  }

  return filtered;
}

/**
 * Sorts dates in ascending order
 */
export function sortDates(dates: string[]): string[] {
  return [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

/**
 * Gets all unique categories from pivot table
 */
export function getUniqueCategories(pivot: Record<string, Record<string, number>>): string[] {
  const categories = new Set<string>();

  for (const row of Object.values(pivot)) {
    for (const category of Object.keys(row)) {
      categories.add(category);
    }
  }

  return Array.from(categories).sort();
}

/**
 * Converts values to billions (divides by 1e9)
 */
export function convertToBillions(
  pivot: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const converted: Record<string, Record<string, number>> = {};

  for (const [date, values] of Object.entries(pivot)) {
    converted[date] = {};
    for (const [category, value] of Object.entries(values)) {
      converted[date][category] = value / 1_000_000_000;
    }
  }

  return converted;
}

/**
 * Converts values to trillions (divides by 1e12)
 */
export function convertToTrillions(
  pivot: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const converted: Record<string, Record<string, number>> = {};

  for (const [date, values] of Object.entries(pivot)) {
    converted[date] = {};
    for (const [category, value] of Object.entries(values)) {
      converted[date][category] = value / 1_000_000_000_000;
    }
  }

  return converted;
}

/**
 * Ensures all specified categories exist in the pivot table (fills with 0 if missing)
 */
export function ensureCategories(
  pivot: Record<string, Record<string, number>>,
  categories: string[]
): Record<string, Record<string, number>> {
  const ensured: Record<string, Record<string, number>> = {};

  for (const [date, values] of Object.entries(pivot)) {
    ensured[date] = { ...values };
    for (const category of categories) {
      if (!(category in ensured[date])) {
        ensured[date][category] = 0;
      }
    }
  }

  return ensured;
}

/**
 * Reorders columns in pivot table according to specified order
 */
export function reorderCategories(
  pivot: Record<string, Record<string, number>>,
  categoryOrder: string[]
): Record<string, Record<string, number>> {
  const reordered: Record<string, Record<string, number>> = {};

  for (const [date, values] of Object.entries(pivot)) {
    reordered[date] = {};
    // Add categories in specified order
    for (const category of categoryOrder) {
      if (category in values) {
        reordered[date][category] = values[category];
      }
    }
    // Add any remaining categories not in the order
    for (const category of Object.keys(values)) {
      if (!categoryOrder.includes(category)) {
        reordered[date][category] = values[category];
      }
    }
  }

  return reordered;
}

/**
 * Combines MATURATION and MATURATION_OFFSET into a single MATURATION column
 */
export function combineMaturationColumns(
  pivot: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const combined: Record<string, Record<string, number>> = {};

  for (const [date, values] of Object.entries(pivot)) {
    combined[date] = { ...values };

    if ('MATURATION_OFFSET' in combined[date]) {
      combined[date]['MATURATION'] = (combined[date]['MATURATION'] || 0) + combined[date]['MATURATION_OFFSET'];
      delete combined[date]['MATURATION_OFFSET'];
    }
  }

  return combined;
}

/**
 * Calculates total across all categories for each date
 */
export function calculateTotal(
  pivot: Record<string, Record<string, number>>,
  excludeCategories: string[] = []
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const [date, values] of Object.entries(pivot)) {
    let total = 0;
    for (const [category, value] of Object.entries(values)) {
      if (!excludeCategories.includes(category)) {
        total += value;
      }
    }
    totals[date] = total;
  }

  return totals;
}

