// The "Request a free analysis" form (/free/request, US-352): its fields'
// options and limits, shared by the page and the server action
// (src/lib/server/free-request.ts). Nothing here is secret.

export const FREE_REQUEST_PATH = "/free/request";

export const REQUEST_KINDS = [
  { value: "chart", label: "A new chart" },
  { value: "dataset", label: "A new dataset" },
  { value: "both", label: "Both" },
] as const;

export type RequestKind = (typeof REQUEST_KINDS)[number]["value"];

// "How would you use it?" options; "" is no answer.
export const USE_CASES = [
  { value: "", label: "Choose one (optional)" },
  { value: "research", label: "Research or analysis" },
  { value: "investing", label: "Investing or trading" },
  { value: "teaching", label: "Teaching or learning" },
  { value: "building", label: "Building a product or tool" },
  { value: "writing", label: "Journalism or writing" },
  { value: "curious", label: "Just curious" },
] as const;

export type UseCase = (typeof USE_CASES)[number]["value"];

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const URL_MAX = 2000;

export const EMAIL_HELP =
  "We'll tell you when your analysis is live, ask if we need more detail, and occasionally share new free analyses. Unsubscribe any time.";

// The form fields a visitor fills in (the honeypot is not one of them).
export interface FreeRequestValues {
  kind: string;
  title: string;
  description: string;
  url: string;
  useCase: string;
  email: string;
}

export type FreeRequestField = keyof FreeRequestValues;

// What the form action returns to the page.
export interface FreeRequestFormState {
  success?: boolean;
  errors?: Partial<Record<FreeRequestField, string>>;
  values?: FreeRequestValues;
  formError?: string;
}

export function kindLabel(kind: string): string {
  return REQUEST_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

export function useCaseLabel(useCase: string): string {
  return USE_CASES.find((u) => u.value === useCase && u.value)?.label ?? "";
}
