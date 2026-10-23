/**
 * US-242: the elections write path. saveElections sends the whole stored
 * portfolio through broker CreateOrUpdate with only the changed elections
 * set, as the generated PortfolioProto / AmortisationElectionsProto. The
 * saveElections form action rejects bad input, stale edits and empty saves
 * without calling CreateOrUpdate.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import portfolio_pkg from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb.js";
import elections_pkg from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/amortisation_elections_pb.js";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";

const { PortfolioProto } = portfolio_pkg;
const {
  AmortisationElectionsProto,
  PremiumAmortisationElectionProto,
  MarketDiscountAccrualMethodProto,
} = elections_pkg;

const searchPortfolio = vi.fn();
const createPortfolio = vi.fn();

vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService",
  () => ({
    PortfolioService: vi
      .fn()
      .mockImplementation(() => ({ searchPortfolio, createPortfolio })),
  })
);
vi.mock("$lib/entity-delete", () => ({ deleteEntity: vi.fn() }));
vi.mock("$lib/transactions", () => ({
  FetchTransactionByPortfolio: vi.fn().mockResolvedValue([]),
}));

import { asOfIso, saveElections } from "$lib/portfolioElections";
import {
  actions,
  load,
} from "../routes/(authenticated)/data/portfolios/+page.server";

const PORTFOLIO_ID = "11111111-2222-3333-4444-555555555555";

/** A stored portfolio: name, uuid, as_of, valid_from and one election set. */
function storedPortfolio() {
  const p = new PortfolioProto();
  p.setPortfolioName("qa-242-probe-x");
  p.setUuid(new UUID(UUID.fromString(PORTFOLIO_ID)).toUUIDProto());
  p.setAsOf(ZonedDateTime.now().toProto());
  p.setValidFrom(ZonedDateTime.now().toProto());
  const e = new AmortisationElectionsProto();
  e.setMarketDiscountAccrual(MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
  p.setAmortisationElections(e);
  return p;
}

let stored: InstanceType<typeof PortfolioProto>;

beforeEach(() => {
  stored = storedPortfolio();
  searchPortfolio.mockReset();
  createPortfolio.mockReset();
  searchPortfolio.mockImplementation(async () => [{ proto: stored }]);
  createPortfolio.mockImplementation(async (sent) => ({
    getPortfolioResponseList: () => [sent],
  }));
});

describe("saveElections", () => {
  test("sends the whole portfolio with only the changed election set", async () => {
    const result = await saveElections(
      PORTFOLIO_ID,
      { bondPremium: PremiumAmortisationElectionProto.PREMIUM_ELECTED },
      asOfIso(stored),
      "key"
    );

    expect(result).toMatchObject({
      ok: true,
      changes: [{ key: "bondPremium", from: 0, to: 1 }],
    });
    expect(createPortfolio).toHaveBeenCalledTimes(1);
    const sent = createPortfolio.mock.calls[0][0];

    // Generated types, not hand-rolled ones.
    expect(sent).toBeInstanceOf(PortfolioProto);
    expect(sent.getAmortisationElections()).toBeInstanceOf(
      AmortisationElectionsProto
    );
    // Other fields go back as stored.
    expect(sent.getPortfolioName()).toBe("qa-242-probe-x");
    expect(Buffer.from(sent.getUuid().serializeBinary())).toEqual(
      Buffer.from(stored.getUuid()!.serializeBinary())
    );
    // The ledger never sets valid_from/valid_to (no versioning yet), so
    // whatever is stored passes through untouched.
    expect(Buffer.from(sent.getValidFrom().serializeBinary())).toEqual(
      Buffer.from(stored.getValidFrom()!.serializeBinary())
    );
    expect(sent.hasValidTo()).toBe(false);
    // Default → PREMIUM_ELECTED writes 1; the unchanged UNSPECIFIED stays 0
    // and the stored CONSTANT_YIELD is kept.
    const e = sent.getAmortisationElections();
    expect(e.getBondPremium()).toBe(1);
    expect(e.getMarketDiscountInclusion()).toBe(0);
    expect(e.getMarketDiscountAccrual()).toBe(
      MarketDiscountAccrualMethodProto.CONSTANT_YIELD
    );
    // The stored proto itself is not mutated.
    expect(stored.getAmortisationElections()!.getBondPremium()).toBe(0);
  });

  test("a portfolio stored with no elections message gets one with only the change", async () => {
    stored.clearAmortisationElections();
    await saveElections(
      PORTFOLIO_ID,
      { marketDiscountAccrual: MarketDiscountAccrualMethodProto.RATABLE },
      asOfIso(stored)
    );
    const e = createPortfolio.mock.calls[0][0].getAmortisationElections();
    expect(e.toObject()).toEqual({
      bondPremium: 0,
      marketDiscountInclusion: 0,
      marketDiscountAccrual: MarketDiscountAccrualMethodProto.RATABLE,
    });
  });

  test("a stale as_of sends nothing", async () => {
    const result = await saveElections(
      PORTFOLIO_ID,
      { bondPremium: 2 },
      "2020-01-01T00:00:00.000Z"
    );
    expect(result).toMatchObject({ ok: false, reason: "stale" });
    expect(createPortfolio).not.toHaveBeenCalled();
  });

  test("values equal to the stored ones send nothing", async () => {
    const result = await saveElections(
      PORTFOLIO_ID,
      {
        marketDiscountAccrual: MarketDiscountAccrualMethodProto.CONSTANT_YIELD,
      },
      asOfIso(stored)
    );
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(createPortfolio).not.toHaveBeenCalled();
  });
});

function formRequest(fields: Record<string, string>) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return new Request("http://localhost/data/portfolios?/saveElections", {
    method: "POST",
    body,
  });
}

const user = { apiKey: "key" };

async function runAction(
  fields: Record<string, string>,
  locals: any = { user }
) {
  return (await actions.saveElections({
    request: formRequest(fields),
    locals,
  } as any)) as any;
}

describe("saveElections action", () => {
  test("a confirmed change is saved once through CreateOrUpdate", async () => {
    const res = await runAction({
      portfolioId: PORTFOLIO_ID,
      baseAsOf: asOfIso(stored),
      bondPremium: "2",
    });
    expect(res.elections).toMatchObject({
      ok: true,
      changes: [{ key: "bondPremium", from: 0, to: 2 }],
    });
    expect(createPortfolio).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["no changes", { portfolioId: PORTFOLIO_ID, baseAsOf: "x" }, 400],
    [
      "an unknown enum value",
      { portfolioId: PORTFOLIO_ID, baseAsOf: "x", bondPremium: "7" },
      400,
    ],
    [
      "an empty value",
      { portfolioId: PORTFOLIO_ID, baseAsOf: "x", bondPremium: "" },
      400,
    ],
    ["a missing portfolio", { baseAsOf: "x", bondPremium: "2" }, 400],
    [
      "a stale as_of",
      {
        portfolioId: PORTFOLIO_ID,
        baseAsOf: "2020-01-01T00:00:00.000Z",
        bondPremium: "2",
      },
      409,
    ],
  ])("%s fails with %s… and sends nothing", async (_name, fields, status) => {
    const res = await runAction(fields as Record<string, string>);
    expect(res.status).toBe(status);
    expect(res.data.elections.ok).toBe(false);
    expect(createPortfolio).not.toHaveBeenCalled();
  });

  test("no signed-in user is refused", async () => {
    const res = await runAction(
      { portfolioId: PORTFOLIO_ID, baseAsOf: "x", bondPremium: "2" },
      {}
    );
    expect(res.status).toBe(401);
    expect(searchPortfolio).not.toHaveBeenCalled();
  });

  test("an unknown portfolio is a 404", async () => {
    searchPortfolio.mockResolvedValue([]);
    const res = await runAction({
      portfolioId: PORTFOLIO_ID,
      baseAsOf: "x",
      bondPremium: "2",
    });
    expect(res.status).toBe(404);
    expect(createPortfolio).not.toHaveBeenCalled();
  });

  test("a broker error is a 502 carrying its details", async () => {
    createPortfolio.mockRejectedValue({ code: 13, details: "ledger down" });
    const res = await runAction({
      portfolioId: PORTFOLIO_ID,
      baseAsOf: asOfIso(stored),
      bondPremium: "2",
    });
    expect(res.status).toBe(502);
    expect(res.data.elections.error).toBe("ledger down");
  });
});

describe("/data/portfolios load with ?portfolioId=", () => {
  test("returns the stored elections and their as_of", async () => {
    const result: any = await load({
      locals: { user },
      url: new URL(
        `http://localhost/data/portfolios?portfolioId=${PORTFOLIO_ID}`
      ),
    } as any);
    expect(result.elections).toEqual({
      asOf: asOfIso(stored),
      elections: {
        bondPremium: 0,
        marketDiscountInclusion: 0,
        marketDiscountAccrual: MarketDiscountAccrualMethodProto.CONSTANT_YIELD,
      },
    });
    expect(result.electionsError).toBeNull();
  });
});
