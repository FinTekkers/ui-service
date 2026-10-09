/**
 * US-207: the /data/securities dropdowns take their values AND labels from
 * ledger-models only (LM-275, @fintekkers/ledger-models 0.4.29+).
 *
 *   - metric 1: SecuritySelect's four selects list exactly ledger-models'
 *     values, each showing ledger-models' label.
 *   - metric 2: no hard-coded union, label map or fallback is left in (or
 *     re-declared beside) src/lib/securityFilterTypes.ts.
 *   - metric 3: every asset-class code reaches the Security/Search request
 *     unchanged, via the securities page-server load.
 *   - metric 4: the asset-class post-filter keeps exactly the rows
 *     ledger-models' assetClassMatches matches.
 */
import fs from "fs";
import path from "path";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";

// Wrap the real helper so calls are observable; ESM namespace exports can't
// be vi.spyOn'd.
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy")
    >();
    return {
      ...actual,
      assetClassMatches: vi.fn(actual.assetClassMatches),
    };
  }
);

// Security/Search stub: records each request and streams `streamed` back.
const searchRequests: any[] = [];
let streamed: any[] = [];
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js",
  () => ({
    SecurityClient: vi.fn().mockImplementation(() => ({
      search: vi.fn().mockImplementation((req: any) => {
        searchRequests.push(req);
        const stream = {
          on(event: string, handler: Function) {
            if (event === "data") {
              handler({ getSecurityResponseList: () => streamed });
            }
            if (event === "end") handler();
            return stream;
          },
        };
        return stream;
      }),
    })),
  })
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

import * as hierarchy from "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy";
import { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb";
import { IdentifierProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import fieldPkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import SecuritySelect from "../components/widgets/SecuritySelect.svelte";
import {
  identifierTypeNameLabelOf,
  identifierTypeNamePlaceholderOf,
} from "$lib/securityFilterTypes";
import { FetchSecurity } from "$lib/security";
import { load } from "../routes/(authenticated)/data/securities/+page.server";
import { expectLedgerModelsAtLeast } from "./ledgerModelsPin";

const { FieldProto } = fieldPkg;
const ROOT = path.resolve(__dirname, "../..");
const LM_RELEASE = "0.4.29";

function optionsOf(select: HTMLSelectElement) {
  return Array.from(select.options).map((o) => ({
    value: o.value,
    text: (o.textContent ?? "").trim(),
  }));
}

describe("metric 1: SecuritySelect dropdowns come from ledger-models", () => {
  const cases = [
    {
      name: "Product Type",
      selector: "#product-type-select",
      values: () => hierarchy.activeProductTypes(),
      label: (v: string) => hierarchy.labelOf(v),
      ordered: true,
      hasAll: true,
    },
    {
      name: "Identifier Type",
      selector: 'select[aria-label="Identifier type"]',
      values: () => Identifier.getAllTypeNames(),
      label: (v: string) => identifierTypeNameLabelOf(v),
      ordered: true,
      hasAll: false,
    },
    {
      name: "Instrument Type",
      selector: "#instrument-type-select",
      values: () => hierarchy.allInstrumentTypes(),
      label: (v: string) => hierarchy.instrumentTypeCodeLabelOf(v),
      ordered: true,
      hasAll: true,
    },
    {
      // Reordered parent-first by tree depth, so compared as a set.
      name: "Asset Class",
      selector: "#asset-class-input",
      values: () => hierarchy.allAssetClasses(),
      label: (v: string) => hierarchy.assetClassLabelOf(v),
      ordered: false,
      hasAll: true,
    },
  ];

  for (const c of cases) {
    test(`${c.name}: options equal ledger-models' list, each with its label`, () => {
      const { container } = render(SecuritySelect);
      const select = container.querySelector(c.selector) as HTMLSelectElement;
      expect(select).not.toBeNull();
      const opts = optionsOf(select);
      const blanks = opts.filter((o) => o.value === "");
      if (c.hasAll) {
        // Exactly one "All" entry, first, as before.
        expect(blanks).toHaveLength(1);
        expect(opts[0].value).toBe("");
      } else {
        expect(blanks).toHaveLength(0);
      }

      const coded = opts.filter((o) => o.value !== "");
      const expected = c.values();
      expect(expected.length).toBeGreaterThan(0);
      expect(coded).toHaveLength(expected.length);
      if (c.ordered) {
        expect(coded.map((o) => o.value)).toEqual(expected);
      } else {
        expect(new Set(coded.map((o) => o.value))).toEqual(new Set(expected));
      }

      for (const o of coded) {
        const label = c.label(o.value);
        expect(typeof label).toBe("string");
        expect((label as string).length).toBeGreaterThan(0);
        expect(o.text).toBe(label);
      }
    });
  }

  test("identifier placeholder is ledger-models' placeholder for every type", async () => {
    const { container } = render(SecuritySelect);
    const select = container.querySelector(
      'select[aria-label="Identifier type"]'
    ) as HTMLSelectElement;
    const input = container.querySelector(
      "#identifier-input"
    ) as HTMLInputElement;
    for (const name of Identifier.getAllTypeNames()) {
      await fireEvent.change(select, { target: { value: name } });
      const placeholder = identifierTypeNamePlaceholderOf(name);
      expect(typeof placeholder).toBe("string");
      expect((placeholder as string).length).toBeGreaterThan(0);
      expect(input.placeholder).toBe(placeholder);
    }
  });
});

describe("guardrail 1: ledger-models is the LM-275 release", () => {
  test(`package-lock pins ${LM_RELEASE} or later and package.json's range resolves to it`, () => {
    expectLedgerModelsAtLeast(LM_RELEASE);
  });
});

// ----- metric 2 -----

const REMOVED_TYPES = [
  "AssetClassName",
  "ProductTypeName",
  "InstrumentTypeName",
  "IdentifierTypeName",
];
const REMOVED_MAPS = [
  "IDENTIFIER_TYPE_LABELS",
  "IDENTIFIER_TYPE_PLACEHOLDERS",
  "INSTRUMENT_TYPE_LABELS",
  "PRODUCT_TYPE_LABELS",
  "ASSET_CLASS_LABELS",
];
const DEFINES_REMOVED = new RegExp(
  `\\b(?:type|interface)\\s+(?:${REMOVED_TYPES.join("|")})\\b|\\b(?:${[
    ...REMOVED_TYPES,
    ...REMOVED_MAPS,
  ].join("|")})\\b`
);
// A union of quoted codes, either quote style: "EQUITY" | 'RATES'.
const QUOTED_CODE_UNION = /["'][A-Z][A-Z0-9_]*["']\s*\|(?!\|)/;
// A Record<…> object literal, e.g. `: Record<string, string> = {`.
const RECORD_LITERAL = /Record<[^>]*>\s*=\s*(?:Object\.fromEntries|\{)/;
// An array literal of two or more quoted upper-case codes.
const CODE_ARRAY_LITERAL =
  /\[\s*["'][A-Z][A-Z0-9_]*["']\s*,\s*["'][A-Z][A-Z0-9_]*["']/;
// A label fallback to the raw code: `?? name`, `?? t`, `?? type`, `?? code`.
const RAW_CODE_FALLBACK = /\?\?\s*(?:name|t|type|code|v|value)\b/;

const PATTERNS: Array<[string, RegExp]> = [
  ["removed type or map", DEFINES_REMOVED],
  ["quoted-code union", QUOTED_CODE_UNION],
  ["Record literal", RECORD_LITERAL],
  ["code array literal", CODE_ARRAY_LITERAL],
  ["raw-code fallback", RAW_CODE_FALLBACK],
];

// The barrel plus every file that imported the removed unions or maps
// (prices/+page.svelte excepted: its PROTO_TO_URL is a URL-key map and its
// PRICES_SUPPORTED_TYPES a deliberate subset, both source-text asserted).
const DROPDOWN_PATH_FILES = [
  "src/lib/securityFilterTypes.ts",
  "src/components/filters/AssetClassFilter.svelte",
  "src/components/filters/ProductTypeFilter.svelte",
  "src/components/filters/IdentifierFilter.svelte",
  "src/components/filters/InstrumentTypeFilter.svelte",
  "src/components/widgets/SecuritySelect.svelte",
  "src/components/widgets/PositionSelect.svelte",
  "src/lib/positions.ts",
  "src/routes/(authenticated)/data/securities/+page.server.ts",
  "src/routes/(authenticated)/data/positions/+page.server.ts",
  "src/routes/(authenticated)/data/prices/+page.server.ts",
];

function stripComments(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'])\/\/.*$/gm, "$1");
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (
      /\.(ts|svelte)$/.test(entry.name) &&
      !/\.test\.ts$/.test(entry.name)
    )
      out.push(full);
  }
  return out;
}

describe("metric 2: no hard-coded lists, unions or label maps", () => {
  test("securityFilterTypes.ts no longer defines the removed unions or maps", () => {
    const src = fs.readFileSync(
      path.join(ROOT, "src/lib/securityFilterTypes.ts"),
      "utf-8"
    );
    for (const name of [...REMOVED_TYPES, ...REMOVED_MAPS]) {
      expect(src).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  test("no file under src/ re-declares or imports a removed union or map", () => {
    const offenders = sourceFiles(path.join(ROOT, "src"))
      .filter((f) =>
        DEFINES_REMOVED.test(stripComments(fs.readFileSync(f, "utf-8")))
      )
      .map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  test("no replacement union, map, code list or fallback on the dropdown path", () => {
    const offenders: string[] = [];
    for (const rel of DROPDOWN_PATH_FILES) {
      const src = stripComments(fs.readFileSync(path.join(ROOT, rel), "utf-8"));
      for (const [kind, re] of PATTERNS) {
        if (re.test(src)) offenders.push(`${rel}: ${kind}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test("each scan pattern catches a planted bad snippet", () => {
    const planted: Array<[RegExp, string]> = [
      [DEFINES_REMOVED, 'export type AssetClassName = "EQUITY";'],
      [DEFINES_REMOVED, "const IDENTIFIER_TYPE_LABELS = {};"],
      [DEFINES_REMOVED, "type IdentifierTypeName = string;"],
      [QUOTED_CODE_UNION, 'type X = "EQUITY" | "RATES";'],
      [QUOTED_CODE_UNION, "type X = 'CASH' | 'DERIVATIVE';"],
      [
        RECORD_LITERAL,
        "const L: Record<string, string> = { EQUITY: 'Equity' };",
      ],
      [
        RECORD_LITERAL,
        "const L: Record<string, string> = Object.fromEntries([]);",
      ],
      [CODE_ARRAY_LITERAL, "const xs = ['EQUITY', 'RATES'];"],
      [CODE_ARRAY_LITERAL, 'const xs = [\n  "CASH",\n  "DERIVATIVE",\n];'],
      [RAW_CODE_FALLBACK, "{labels[t] ?? t}"],
      [RAW_CODE_FALLBACK, "labelOf(name) ?? name"],
    ];
    for (const [re, snippet] of planted) {
      expect(re.test(snippet), `${re} should match ${snippet}`).toBe(true);
    }
    // And comments are not mistaken for code.
    expect(
      DEFINES_REMOVED.test(stripComments("// was IdentifierTypeName"))
    ).toBe(false);
  });
});

// ----- metric 3 -----

function assetClassFilters(req: any): string[] {
  return req
    .getSearchSecurityInput()
    .getFiltersList()
    .filter((f: any) => f.getField() === FieldProto.ASSET_CLASS)
    .map((f: any) => f.getStringValue());
}

describe("metric 3: each asset class reaches Security/Search unchanged", () => {
  beforeEach(() => {
    searchRequests.length = 0;
    streamed = [];
  });

  for (const code of hierarchy.allAssetClasses()) {
    test(`?assetClass=${code} → one ASSET_CLASS filter equal to ${code}`, async () => {
      await load({
        locals: {},
        request: {
          url: `http://localhost/data/securities?assetClass=${encodeURIComponent(
            code
          )}`,
        },
      } as any);
      expect(searchRequests).toHaveLength(1);
      expect(assetClassFilters(searchRequests[0])).toEqual([code]);
    });
  }
});

// ----- metric 4 -----

function securityProto(ticker: string, assetClass: string) {
  const proto = new SecurityProto()
    .setObjectClass("Security")
    .setVersion("0.0.1")
    .setUuid(UUID.random().toUUIDProto())
    .setAsOf(ZonedDateTime.now().toProto())
    .setProductType(ProductTypeProto.COMMON_STOCK)
    .setIssuerName("Test Issuer")
    .setAssetClass(assetClass);
  proto.addIdentifiers(
    new IdentifierProto()
      .setIdentifierType(IdentifierTypeProto.EXCH_TICKER)
      .setIdentifierValue(ticker)
  );
  return proto;
}

describe("metric 4: post-filter uses ledger-models' assetClassMatches", () => {
  const fixture = [
    { ticker: "R1", assetClass: "RATES" },
    { ticker: "E1", assetClass: "EQUITY" },
    { ticker: "C1", assetClass: "CREDIT" },
    { ticker: "B1", assetClass: "" },
    { ticker: "F1", assetClass: "FIXED_INCOME" },
    { ticker: "M1", assetClass: "METALS" },
    { ticker: "L1", assetClass: "Fixed Income" },
  ];
  const filterCode = "FIXED_INCOME";

  beforeEach(() => {
    searchRequests.length = 0;
    streamed = fixture.map((r) => securityProto(r.ticker, r.assetClass));
    vi.mocked(hierarchy.assetClassMatches).mockClear();
  });

  test("keeps exactly the rows the helper matches, in input order", async () => {
    const rows = await FetchSecurity(filterCode, null);

    const helper = vi.mocked(hierarchy.assetClassMatches);
    expect(helper.mock.calls).toEqual(
      fixture.map((r) => [filterCode, r.assetClass])
    );

    const expected = fixture
      .filter((r, i) => helper.mock.results[i].value === true)
      .map((r) => r.ticker);
    // Both outcomes are exercised: some rows kept, some dropped.
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(fixture.length);
    expect(rows.map((r) => r.identifier)).toEqual(expected);
  });

  test("no asset class selected → helper not consulted, no row dropped by it", async () => {
    const rows = await FetchSecurity(null, "Test Issuer");
    expect(vi.mocked(hierarchy.assetClassMatches)).not.toHaveBeenCalled();
    expect(rows.map((r) => r.identifier)).toEqual(fixture.map((r) => r.ticker));
  });
});
