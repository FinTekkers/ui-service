// The public datasets in the Free data explorer (/free/*). DatasetPicker
// lists these, and each dataset's page lives at its href.
export interface FreeDataset {
  id: "soma" | "tips" | "spy" | "tech-vs-sp500";
  label: string;
  href: string;
}

export const FREE_DATASETS: readonly FreeDataset[] = [
  { id: "soma", label: "Federal Reserve SOMA Holdings", href: "/free/soma" },
  {
    id: "tips",
    label: "Treasury Inflation Protected Securities",
    href: "/free/tips",
  },
  { id: "spy", label: "SPDR S&P 500 ETF Trust (SPY)", href: "/free/spy" },
  {
    id: "tech-vs-sp500",
    label: "Tech's drawdown relative to the S&P 500",
    href: "/free/tech-vs-sp500",
  },
];

// True on the dataset's page and any page below it (/free/tips/<cusip>),
// but not on a sibling that only shares the prefix (/free/tipsx).
export function isCurrentDataset(
  dataset: FreeDataset,
  pathname: string
): boolean {
  return pathname === dataset.href || pathname.startsWith(dataset.href + "/");
}
