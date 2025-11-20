/**
 * Universal client-side sorting utilities for table components
 */

export type SortDirection = 'asc' | 'desc';

export interface SortState<T = any> {
  sortField: T | null;
  sortDirection: SortDirection;
}

/**
 * Generic comparison function that handles:
 * - null/undefined values
 * - numeric values
 * - string values
 * - Date objects
 */
export function compareValues(
  valueA: any,
  valueB: any,
  sortDirection: SortDirection
): number {
  // Handle null/undefined values
  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return 1;
  if (valueB == null) return -1;

  let comparison = 0;

  // Handle Date objects
  if (valueA instanceof Date && valueB instanceof Date) {
    comparison = valueA.getTime() - valueB.getTime();
  }
  // Handle objects with toEpochSecond method (LocalDate/ZonedDateTime)
  else if (
    typeof valueA.toEpochSecond === 'function' &&
    typeof valueB.toEpochSecond === 'function'
  ) {
    comparison = valueA.toEpochSecond() - valueB.toEpochSecond();
  }
  // Try numeric comparison
  else {
    const numA = Number(valueA);
    const numB = Number(valueB);
    if (!isNaN(numA) && !isNaN(numB)) {
      comparison = numA - numB;
    } else {
      // Fall back to string comparison
      comparison = String(valueA).localeCompare(String(valueB));
    }
  }

  return sortDirection === 'desc' ? -comparison : comparison;
}

/**
 * Generic sort function for arrays of objects
 * @param data - Array of objects to sort
 * @param sortField - Field/key to sort by (can be string key or function to extract value)
 * @param sortDirection - Sort direction
 * @returns Sorted array (new array, original is not modified)
 */
export function sortData<T extends Record<string, any>>(
  data: T[],
  sortField: keyof T | null,
  sortDirection: SortDirection
): T[] {
  if (sortField === null || data.length === 0) {
    return data;
  }

  return [...data].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];
    return compareValues(valueA, valueB, sortDirection);
  });
}

/**
 * Sort function for PositionGrid which uses numeric indices and requestData
 * @param data - Array of position objects
 * @param sortField - Numeric index of the field/measure
 * @param sortDirection - Sort direction
 * @param isField - Whether sorting by field (true) or measure (false)
 * @param requestData - Object containing fields and measures arrays
 * @returns Sorted array
 */
export function sortPositions(
  data: any[],
  sortField: number | null,
  sortDirection: SortDirection,
  isField: boolean,
  requestData: { fields: any[]; measures: any[] }
): any[] {
  if (sortField === null || data.length === 0) {
    return data;
  }

  return [...data].sort((a, b) => {
    const key = isField
      ? requestData.fields[sortField]
      : requestData.measures[sortField];
    const valueA = a[key];
    const valueB = b[key];
    return compareValues(valueA, valueB, sortDirection);
  });
}

/**
 * Get sort indicator arrow (↑ or ↓) based on current sort state
 */
export function getSortIndicator<T>(
  currentField: T | null,
  targetField: T,
  sortDirection: SortDirection
): string {
  if (currentField === targetField) {
    return sortDirection === 'asc' ? '↑' : '↓';
  }
  return '';
}

/**
 * Handle header click to update sort state
 * @param currentSortField - Currently active sort field
 * @param clickedField - Field that was clicked
 * @param currentSortDirection - Current sort direction
 * @returns New sort state
 */
export function handleSortClick<T>(
  currentSortField: T | null,
  clickedField: T,
  currentSortDirection: SortDirection
): SortState<T> {
  if (currentSortField === clickedField) {
    // Toggle direction if clicking the same column
    return {
      sortField: clickedField,
      sortDirection: currentSortDirection === 'asc' ? 'desc' : 'asc',
    };
  } else {
    // New column, start with ascending
    return {
      sortField: clickedField,
      sortDirection: 'asc',
    };
  }
}

/**
 * Initialize sort state from URL parameters
 * @param urlParams - URLSearchParams object
 * @param sortByParam - Name of the sortBy URL parameter (default: 'sortBy')
 * @param sortDirectionParam - Name of the sortDirection URL parameter (default: 'sortDirection')
 * @param fieldMapper - Function to map URL string to actual field type
 * @returns Sort state or null if not found in URL
 */
export function initSortFromUrl<T>(
  urlParams: URLSearchParams,
  fieldMapper: (urlValue: string) => T | null,
  sortByParam: string = 'sortBy',
  sortDirectionParam: string = 'sortDirection'
): SortState<T> | null {
  const sortBy = urlParams.get(sortByParam);
  const sortDir = urlParams.get(sortDirectionParam) || 'asc';

  if (sortBy) {
    const mappedField = fieldMapper(sortBy);
    if (mappedField !== null) {
      return {
        sortField: mappedField,
        sortDirection: (sortDir === 'desc' ? 'desc' : 'asc') as SortDirection,
      };
    }
  }

  return null;
}

