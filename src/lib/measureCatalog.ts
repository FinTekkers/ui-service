/**
 * US-297: the measure catalog and its product-type coverage, read from the
 * published @fintekkers/ledger-models package (catalog/measures.json, with
 * LM-402's full measure list and LM-403's computed_by / depends_on). This is
 * the only file that names the package's catalog path.
 *
 * Nothing here lists measures, product types or hierarchy nodes: columns and
 * groups come from product_hierarchy, coverage from the catalog's applies_to
 * resolved through product_hierarchy's isDescendantOf. A missing or wrong
 * value is fixed in ledger-models, never here.
 */
import catalog from "@fintekkers/ledger-models/catalog/measures.json";
import {
  activeProductTypes,
  isDescendantOf,
  labelOf,
  parentOf,
} from "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy";

/** A catalog entry; the package JSON is type-checked against this shape. */
export interface CatalogMeasure {
  name: string;
  enum_value: number;
  display_name: string;
  description: string;
  formula: string | null;
  units: string | null;
  category: string;
  applies_to: string[];
  model_assumptions: string[];
  implemented: boolean;
  computed_by: string | null;
  depends_on: string[];
}

const ENTRIES: readonly CatalogMeasure[] = catalog.measures;

// The catalog's UNKNOWN_MEASURE entry is a placeholder, not a measure.
export const MEASURES: readonly CatalogMeasure[] = ENTRIES.filter(
  (m) => m.category !== "sentinel"
);

const BY_NAME = new Map<string, CatalogMeasure>(
  MEASURES.map((m) => [m.name, m])
);

/** The catalog measure with this name, or undefined (e.g. an input name). */
export function measureByName(name: string): CatalogMeasure | undefined {
  return BY_NAME.get(name);
}

export interface ProductGroup {
  /** product_hierarchy node, e.g. GOV_BOND */
  node: string;
  label: string;
  /** active product types directly under the node, in hierarchy order */
  productTypes: string[];
}

/** The hierarchy node the matrix opens expanded (Government bonds). */
export const DEFAULT_EXPANDED_NODE = "GOV_BOND";

/**
 * One group per hierarchy node that is the parent of an active product
 * type; a top-level active type groups under itself. product_hierarchy
 * lists types alphabetically, so groups are ordered by how many catalog
 * cells they define (most first, ties keep that order).
 */
export function productGroups(): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();
  for (const productType of activeProductTypes()) {
    const node = parentOf(productType) ?? productType;
    let group = groups.get(node);
    if (!group) {
      group = { node, label: labelOf(node) ?? node, productTypes: [] };
      groups.set(node, group);
    }
    group.productTypes.push(productType);
  }
  const coverage = (g: ProductGroup) =>
    MEASURES.reduce((n, m) => n + groupCount(m, g).defined, 0);
  return [...groups.values()]
    .map((g) => ({ g, n: coverage(g) }))
    .sort((a, b) => b.n - a.n)
    .map(({ g }) => g);
}

export type CellState = "defined" | "excluded";

/**
 * Defined when an applies_to entry names the product type or one of its
 * ancestor nodes (LM-372); excluded otherwise.
 */
export function cellState(
  measure: Pick<CatalogMeasure, "applies_to">,
  productType: string
): CellState {
  return measure.applies_to.some(
    (node) => node === productType || isDescendantOf(productType, node)
  )
    ? "defined"
    : "excluded";
}

export function groupCount(
  measure: Pick<CatalogMeasure, "applies_to">,
  group: ProductGroup
): { defined: number; total: number } {
  const defined = group.productTypes.filter(
    (pt) => cellState(measure, pt) === "defined"
  ).length;
  return { defined, total: group.productTypes.length };
}
