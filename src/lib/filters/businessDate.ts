/**
 * Business date for /data/positions and /data/transactions (US-291).
 *
 * The page-server resolves the URL into a BusinessDateState once per
 * request, with "today" fixed on the server (UTC). The fetchers get the
 * trade-date filter from it, and the control and headings render from the
 * same state, so the query and the label always show one date.
 *
 * URL shapes:
 *   ?businessDate=YYYY-MM-DD  TRADE_DATE LESS_THAN_OR_EQUALS that date
 *   ?businessDate=all         no trade-date filter (future-dated rows too)
 *   (none)                    today
 *   ?tradeDate=…&tradeDateOperator=…  old links, read as before
 *
 * Pure module: no Svelte, no gRPC, safe to import in the browser.
 */
import type { FilterOverrides } from "./urlState";

export type BusinessDateMode = "date" | "all";

export interface BusinessDateState {
  mode: BusinessDateMode;
  /** YYYY-MM-DD when mode is "date", else null. */
  date: string | null;
  /** LESS_THAN_OR_EQUALS, or an old link's operator name, when mode is "date". */
  tradeDateOperator: string | null;
  /** The server's UTC date for this request. */
  today: string;
  /** True when read from an old tradeDate/tradeDateOperator link. */
  legacy: boolean;
  /** True when the position type is TAX_LOT (never a trade-date filter). */
  taxLot: boolean;
}

export const BUSINESS_DATE_OPERATOR = "LESS_THAN_OR_EQUALS";
export const BUSINESS_DATE_ALL = "all";
// PositionTypeProto name. Tax lots have no TRADE_DATE: a TRADE_DATE filter
// crashes the tax-lot query, so the page never sends one for them.
export const TAX_LOT_POSITION_TYPE = "TAX_LOT";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** True for a real calendar date written YYYY-MM-DD (2026-02-30 is not). */
export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's date in UTC, YYYY-MM-DD. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The position-type URL value (one or more comma-separated names) is TAX_LOT. */
export function isTaxLot(positionType: string | null | undefined): boolean {
  return (positionType ?? "").split(",").includes(TAX_LOT_POSITION_TYPE);
}

export function resolveBusinessDate(
  params: URLSearchParams,
  today: string,
  positionType?: string | null
): BusinessDateState {
  const base = { today, legacy: false, taxLot: false };
  const all = (extra: Partial<BusinessDateState> = {}): BusinessDateState => ({
    ...base,
    mode: "all",
    date: null,
    tradeDateOperator: null,
    ...extra,
  });
  const onOrBefore = (date: string): BusinessDateState => ({
    ...base,
    mode: "date",
    date,
    tradeDateOperator: BUSINESS_DATE_OPERATOR,
  });

  if (isTaxLot(positionType)) return all({ taxLot: true });

  const businessDate = params.get("businessDate");
  if (businessDate === BUSINESS_DATE_ALL) return all();
  if (isIsoDate(businessDate)) return onOrBefore(businessDate);

  const tradeDate = params.get("tradeDate");
  const tradeDateOperator = params.get("tradeDateOperator");
  if (tradeDate || tradeDateOperator) {
    // Old links: both params pass through as before (the operator is
    // validated by PositionFilterOperator.fromName in the fetchers, #229).
    // One without the other was never applied, so it means no filter.
    if (tradeDate && tradeDate.trim() !== "" && tradeDateOperator) {
      return {
        ...base,
        mode: "date",
        date: tradeDate,
        tradeDateOperator,
        legacy: true,
      };
    }
    return all({ legacy: true });
  }

  // No date in the URL, or a businessDate that doesn't parse: today.
  return onOrBefore(today);
}

/** The trade-date pair for FetchPosition / FetchTransaction*. */
export function businessDateFilter(state: BusinessDateState): {
  tradeDate?: string;
  tradeDateOperator?: string;
} {
  if (state.mode !== "date" || !state.date || !state.tradeDateOperator) {
    return {};
  }
  return { tradeDate: state.date, tradeDateOperator: state.tradeDateOperator };
}

/** "2026-10-27" → "27 Oct 2026". Fixed month names, no locale, so SSR and
 * the browser render the same text. Anything else is returned as given. */
export function formatBusinessDate(iso: string): string {
  if (!isIsoDate(iso)) return iso;
  const [year, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

/** The line under the control: what the page is showing. */
export function businessDateNote(state: BusinessDateState): string {
  if (state.taxLot) {
    return "Business date isn't available for tax lots yet: showing all data";
  }
  if (state.mode === "all" || !state.date) {
    return "No date filter: showing all data";
  }
  if (state.tradeDateOperator === BUSINESS_DATE_OPERATOR) {
    return `Trades on or before ${formatBusinessDate(state.date)}`;
  }
  // Old link with another operator: the proto name verbatim (#229, no
  // UI-side label map).
  return `Trade date filter: ${state.tradeDateOperator} ${formatBusinessDate(
    state.date
  )}`;
}

/** The heading's scope text, e.g. "as of the end of 27 Oct 2026". */
export function businessDateHeading(
  page: "positions" | "transactions",
  state: BusinessDateState
): string {
  if (state.mode === "all" || !state.date) {
    return "all dates, including future-dated activity";
  }
  if (state.tradeDateOperator !== BUSINESS_DATE_OPERATOR) {
    return `trade date ${state.tradeDateOperator} ${formatBusinessDate(
      state.date
    )}`;
  }
  const date = formatBusinessDate(state.date);
  return page === "positions"
    ? `as of the end of ${date}`
    : `trades on or before ${date}`;
}

/** URL overrides for buildFilterUrl: writes businessDate and always drops
 * the old tradeDate/tradeDateOperator params. A date mode without a valid
 * date leaves businessDate out, which the page reads as today. */
export function businessDateUrlOverrides(
  mode: BusinessDateMode,
  date: string | null
): FilterOverrides {
  let businessDate: string | null = null;
  if (mode === "all") businessDate = BUSINESS_DATE_ALL;
  else if (isIsoDate(date)) businessDate = date;
  return { businessDate, tradeDate: null, tradeDateOperator: null };
}
