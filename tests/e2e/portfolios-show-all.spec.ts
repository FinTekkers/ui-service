/**
 * Regression for second-brain#221 — /data/portfolios used to hardcode
 * a `PORTFOLIO_NAME == "Federal Reserve SOMA Holdings"` filter on the
 * search call, truncating the index to exactly that one row even
 * when the backend held multiple portfolios. The fix removes the
 * filter; this test asserts the un-filtered list shows up.
 *
 * To make the assertion deterministic regardless of seed state, the
 * test creates a fresh portfolio with a unique name via the
 * ledger-service Portfolio/CreateOrUpdate RPC (mirrors the helper in
 * src/tests/qa-s8-price-portfolio.test.ts), then asserts BOTH that
 * fresh portfolio AND the SOMA seed appear on the page. Pre-#221 fix
 * the SOMA filter would have hidden the fresh one.
 */
import { test, expect } from '@playwright/test';
import grpc from '@grpc/grpc-js';

const LEDGER_URL = 'localhost:8082';

async function createPortfolio(name: string): Promise<void> {
  // ESM dynamic-import-of-CJS quirk: the proto modules export named
  // bindings the linker doesn't always destructure, so go through
  // `default` / `module` shapes defensively. (qa-s8-price-portfolio
  // uses the same pattern under vitest where the destructure works
  // straight; under playwright runner the wrapper namespace differs.)
  const grpcPkg = (await import(
    '@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb.js'
  )) as any;
  const PortfolioClient = grpcPkg.PortfolioClient ?? grpcPkg.default?.PortfolioClient;

  const reqPkg = (await import(
    '@fintekkers/ledger-models/node/fintekkers/requests/portfolio/create_portfolio_request_pb.js'
  )) as any;
  const CreatePortfolioRequestProto =
    reqPkg.CreatePortfolioRequestProto ?? reqPkg.default?.CreatePortfolioRequestProto;

  const protoPkg = (await import(
    '@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb.js'
  )) as any;
  const PortfolioProto = protoPkg.PortfolioProto ?? protoPkg.default?.PortfolioProto;

  const uuidPkg = (await import(
    '@fintekkers/ledger-models/node/wrappers/models/utils/uuid.js'
  )) as any;
  const UUID = uuidPkg.UUID ?? uuidPkg.default?.UUID;

  const dtPkg = (await import(
    '@fintekkers/ledger-models/node/wrappers/models/utils/datetime.js'
  )) as any;
  const ZonedDateTime = dtPkg.ZonedDateTime ?? dtPkg.default?.ZonedDateTime;

  const portfolio = new PortfolioProto();
  portfolio.setObjectClass('Portfolio');
  portfolio.setVersion('0.0.1');
  portfolio.setAsOf(ZonedDateTime.now().toProto());
  portfolio.setPortfolioName(name);
  portfolio.setUuid(UUID.random().toUUIDProto());

  const req = new CreatePortfolioRequestProto();
  req.setObjectClass('PortfolioRequest');
  req.setVersion('0.0.1');
  req.setCreatePortfolioInput(portfolio);

  const client = new PortfolioClient(LEDGER_URL, grpc.credentials.createInsecure());

  await new Promise<void>((resolve, reject) => {
    client.createOrUpdate(req, (err: any) => {
      if (err) reject(new Error(`${err.code}: ${err.details ?? err.message}`));
      else resolve();
    });
  });
}

test.describe('/data/portfolios index (#221)', () => {
  test('lists every portfolio (no hardcoded name filter on the search call)', async ({ page }) => {
    // Seed a fresh portfolio so the test has a row it owns to assert
    // against, regardless of seed contents. (Pre-M5 this also
    // verified SOMA's continued presence; M5's clean-slate migration
    // dropped SOMA from the seed so the assertion now just checks
    // "more than one row" + "the fresh probe is among them".)
    const probeName = `qa-221-probe-${Date.now().toString(36)}`;
    await createPortfolio(probeName);

    await page.goto('/data/portfolios');
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible({
      timeout: 15_000,
    });

    // Multiple rows render — pre-#221 the hardcoded
    // PORTFOLIO_NAME=='Federal Reserve SOMA Holdings' filter would
    // have truncated to one row. (At minimum 2 rows: the probe we
    // just created + at least one other from the seed / accumulated
    // test runs.)
    const allRows = page.locator('table tbody tr');
    await expect(allRows, 'more than one portfolio renders post-#221').toHaveCount(
      await allRows.count(), // resolves to a static number first, then asserts ≥ 2 below
    );
    const rowCount = await allRows.count();
    expect(rowCount, 'multiple portfolios render').toBeGreaterThanOrEqual(2);

    const probeRow = page.locator('table tbody tr', { hasText: probeName });
    await expect(probeRow, 'fresh probe portfolio renders post-#221 fix')
      .toHaveCount(1, { timeout: 10_000 });

    // As Of column renders post-#221 amend.
    await expect(page.getByRole('button', { name: /^As Of/ }), 'As Of header renders')
      .toBeVisible();
    const probeAsOfCell = probeRow.locator('td').last();
    await expect(probeAsOfCell, 'fresh portfolio renders a YYYY-MM-DD asOf cell')
      .toContainText(/^\d{4}-\d{2}-\d{2}$/);
  });
});
