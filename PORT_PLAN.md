# Port Plan: Python to TypeScript Treasury Positions

## Overview
This document outlines the plan to port treasury position data fetching functionality from Python to TypeScript, specifically:
- Porting `/Users/davidjdoherty/Dev/app-soma-analytics/visualization/data.py` → `lib/treasury_positions.ts`
- Future: Porting `/Users/davidjdoherty/Dev/app-soma-analytics/visualization/graphs.py` → `routes/treasuries2` page

---

## 1. Source Analysis

### 1.1 `data.py` - Main Function to Port
**Function**: `get_transactions(as_of_date: datetime) -> pd.DataFrame`

**Key Operations**:
1. Calls `get_position()` with:
   - `security=None`
   - `portfolio=PORTFOLIO.proto` (Federal Reserve SOMA Holdings)
   - `measures=[MeasureProto.DIRECTED_QUANTITY]`
   - `position_type=PositionTypeProto.TRANSACTION`
   - `fields=[IDENTIFIER, TRANSACTION_TYPE, TRADE_DATE, MATURITY_DATE, ISSUE_DATE, PRODUCT_TYPE, ADJUSTED_TENOR]`
   - `additional_filters=[trade_date_filter]` (filters for `TRADE_DATE <= as_of_date`)
   - `as_of=datetime.now()`

2. Data Processing:
   - Converts positions to DataFrame via `create_dataframe_from_response()`
   - Filters out rows where IDENTIFIER contains "USD"
   - Converts TRADE_DATE to datetime
   - Sets TRADE_DATE as index
   - Sorts by index

### 1.2 `positions.py` - Reference Implementation
**Function**: `get_position()` - Already has TypeScript equivalent in `lib/positions.ts` as `FetchPosition()`

**Function**: `create_dataframe_from_response()` - Needs TypeScript equivalent that converts Position objects to plain objects/arrays

### 1.3 `recon_utils.py` - Helper Function
**Function**: `get_trade_date_filter(tmp: datetime)` - Creates a filter for `TRADE_DATE <= date`
- TypeScript equivalent: Use `PositionFilter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.LESS_THAN_OR_EQUALS, date)`

---

## 2. TypeScript Implementation Plan

### 2.1 File Structure
Create: `src/lib/treasury_positions.ts`

### 2.2 Dependencies to Use
- `@fintekkers/ledger-models` (already in package.json)
- Existing patterns from:
  - `lib/positions.ts` - For position fetching
  - `lib/transactions.ts` - For transaction data structures
  - `routes/treasuries/+page.server.ts` - For portfolio filtering

### 2.3 Key TypeScript Adaptations

#### 2.3.1 Portfolio Reference
- **Python**: `PORTFOLIO.proto` from `data_sources.portfolios`
- **TypeScript**: Use portfolio name string `"Federal Reserve SOMA Holdings"` (as seen in `routes/(authenticated)/data/portfolios/+page.server.ts`)

#### 2.3.2 Position Fetching
- **Python**: `get_position()` from `data_sources.positions`
- **TypeScript**: Use `FetchPosition()` from `lib/positions.ts` OR create a new function that:
  - Uses `PositionService` directly (like `FetchTransactionWithFilter` does)
  - Supports `PositionTypeProto.TRANSACTION`
  - Supports all required fields and measures

#### 2.3.3 Data Transformation
- **Python**: Pandas DataFrame operations
- **TypeScript**: Native JavaScript arrays and objects
  - Filter: Use `Array.filter()`
  - Date conversion: Use `new Date()` or date parsing utilities
  - Sorting: Use `Array.sort()`
  - Indexing: Use objects with date keys or keep as array with date property

#### 2.3.4 Date Filtering
- **Python**: `get_trade_date_filter(as_of_date)` returns `FieldMapEntry`
- **TypeScript**: Use `PositionFilter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.LESS_THAN_OR_EQUALS, asOfDate)`

### 2.4 Function Signature

```typescript
export interface TreasuryTransaction {
  IDENTIFIER: string;
  TRANSACTION_TYPE: string;
  TRADE_DATE: Date | string;
  MATURITY_DATE?: Date | string;
  ISSUE_DATE?: Date | string;
  PRODUCT_TYPE?: string;
  ADJUSTED_TENOR?: string;
  DIRECTED_QUANTITY: number;
}

export async function getTreasuryTransactions(
  asOfDate: Date
): Promise<TreasuryTransaction[] | null>
```

### 2.5 Implementation Steps

1. **Create Position Filter Helper**
   - Function to create trade date filter (equivalent to `get_trade_date_filter`)
   - Function to create portfolio filter

2. **Create Position Fetching Function**
   - Use `PositionService` to fetch transactions
   - Request fields: `[IDENTIFIER, TRANSACTION_TYPE, TRADE_DATE, MATURITY_DATE, ISSUE_DATE, PRODUCT_TYPE, ADJUSTED_TENOR]`
   - Request measures: `[DIRECTED_QUANTITY]`
   - Position type: `TRANSACTION`
   - Apply portfolio and trade date filters

3. **Create Data Transformation Function**
   - Convert Position objects to plain objects (equivalent to `create_dataframe_from_response`)
   - Filter out rows where IDENTIFIER contains "USD"
   - Parse and convert TRADE_DATE to Date objects
   - Sort by TRADE_DATE

4. **Main Export Function**
   - `getTreasuryTransactions(asOfDate: Date)` - Combines all steps

---

## 3. Implementation Details

### 3.1 Required Imports

```typescript
import { PositionService } from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';
import { PositionTypeProto, PositionViewProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb';
import { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
```

### 3.2 Constants

```typescript
const PORTFOLIO_NAME = "Federal Reserve SOMA Holdings";
```

### 3.3 Helper Functions

1. **`createTradeDateFilter(asOfDate: Date): PositionFilter`**
   - Creates filter for `TRADE_DATE <= asOfDate`

2. **`createPortfolioFilter(): PositionFilter`**
   - Creates filter for portfolio name

3. **`positionToPlainObject(position: Position): TreasuryTransaction`**
   - Extracts fields and measures from Position object
   - Converts to plain TypeScript object

4. **`processTransactionData(positions: Position[]): TreasuryTransaction[]`**
   - Filters out USD identifiers
   - Parses dates
   - Sorts by trade date

### 3.4 Main Function

```typescript
export async function getTreasuryTransactions(
  asOfDate: Date = new Date()
): Promise<TreasuryTransaction[] | null> {
  // 1. Create filters
  // 2. Fetch positions using PositionService
  // 3. Transform to plain objects
  // 4. Process and filter data
  // 5. Return sorted array
}
```

---

## 4. Data Structure Mapping

### Python DataFrame → TypeScript Array

| Python Operation | TypeScript Equivalent |
|-----------------|----------------------|
| `df[~df["IDENTIFIER"].str.contains("USD")]` | `array.filter(item => !item.IDENTIFIER.includes("USD"))` |
| `pd.to_datetime(df["TRADE_DATE"])` | `new Date(item.TRADE_DATE)` or date parsing |
| `df.set_index("TRADE_DATE")` | Keep as property, or create Map with date keys |
| `df.sort_index()` | `array.sort((a, b) => a.TRADE_DATE.getTime() - b.TRADE_DATE.getTime())` |

---

## 5. Future: Graphs Porting (`graphs.py` → `routes/treasuries2`)

### 5.1 Functions to Port
1. `activity_over_time(df_txns)` - Bar chart of purchases/sales/maturations over time
2. `net_activity_over_time(df_txns)` - Net activity bar chart
3. `cumulative_position(df_txns)` - Stacked bar chart of cumulative positions by product type
4. `recent_activity(df_txns)` - Stacked bars with moving average and Treasury yield overlay
5. `term_activity(df_txns)` - Stacked bars by term categories

### 5.2 Plotly.js Integration
- Package already available: `plotly.js-dist` (in package.json)
- Use Svelte component to render Plotly graphs
- Convert pandas operations to JavaScript array operations:
  - `pivot_table` → manual grouping/reduction
  - `resample('M')` → date grouping functions
  - `cumsum()` → `reduce()` with accumulator
  - `rolling(window=6).mean()` → custom moving average function

### 5.3 Data Processing Utilities Needed
- Date grouping/resampling functions
- Pivot/grouping utilities
- Moving average calculation
- Cumulative sum calculation

---

## 6. Testing Considerations

### 6.1 Unit Tests
- Test filter creation
- Test data transformation
- Test filtering logic (USD exclusion)
- Test date parsing and sorting

### 6.2 Integration Tests
- Test end-to-end position fetching
- Test with actual portfolio data
- Test date filtering edge cases

---

## 7. Implementation Checklist

### Phase 1: Core Data Fetching (`lib/treasury_positions.ts`)
- [ ] Create file structure and imports
- [ ] Implement `createTradeDateFilter()` helper
- [ ] Implement `createPortfolioFilter()` helper
- [ ] Implement `positionToPlainObject()` helper
- [ ] Implement `processTransactionData()` helper
- [ ] Implement main `getTreasuryTransactions()` function
- [ ] Add TypeScript types/interfaces
- [ ] Test with sample data

### Phase 2: Integration
- [ ] Test with actual portfolio service
- [ ] Verify data transformations match Python output
- [ ] Handle error cases (no results, service errors)
- [ ] Add logging/debugging

### Phase 3: Future - Graphs (when ready)
- [ ] Create `routes/treasuries2/+page.server.ts` to fetch data
- [ ] Create `routes/treasuries2/+page.svelte` for UI
- [ ] Port data processing utilities (grouping, resampling, etc.)
- [ ] Port each graph function from `graphs.py`
- [ ] Create Svelte components for Plotly graphs
- [ ] Test each visualization

---

## 8. Notes and Considerations

### 8.1 Differences from Python
- No pandas: Use native JavaScript/TypeScript array methods
- Date handling: JavaScript Date objects vs pandas datetime
- No DataFrame index: Use array with date property or Map structure
- Type safety: Leverage TypeScript types for better safety

### 8.2 Performance
- Consider pagination if result sets are large
- Consider caching for frequently accessed data
- Consider date range limiting for initial implementation

### 8.3 Error Handling
- Handle service unavailability
- Handle empty result sets
- Handle malformed data
- Provide meaningful error messages

### 8.4 Dependencies
- All required packages already in `package.json`
- No new dependencies needed for Phase 1

---

## 9. Reference Files

### Source Files (Python)
- `/Users/davidjdoherty/Dev/app-soma-analytics/visualization/data.py`
- `/Users/davidjdoherty/Dev/app-soma-analytics/data_sources/positions.py`
- `/Users/davidjdoherty/Dev/app-soma-analytics/recon/recon_utils.py`
- `/Users/davidjdoherty/Dev/app-soma-analytics/visualization/graphs.py` (future)

### Target Files (TypeScript)
- `src/lib/treasury_positions.ts` (to be created)
- `src/routes/treasuries2/+page.server.ts` (future)
- `src/routes/treasuries2/+page.svelte` (future)

### Reference Files (TypeScript - existing)
- `src/lib/positions.ts` - Position fetching patterns
- `src/lib/transactions.ts` - Transaction data structures
- `src/routes/treasuries/+page.server.ts` - Treasury filtering examples
- `src/routes/(authenticated)/data/portfolios/+page.server.ts` - Portfolio service usage

