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

const SOMA_NAME = 'Federal Reserve SOMA Holdings';
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
  test('lists every portfolio (the SOMA-only filter is gone)', async ({ page }) => {
    // Seed a fresh portfolio so the assertion is deterministic
    // regardless of what's already on the backend.
    const probeName = `qa-221-probe-${Date.now().toString(36)}`;
    await createPortfolio(probeName);

    await page.goto('/data/portfolios');
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible({
      timeout: 15_000,
    });

    // Both rows must render. Pre-fix, the hardcoded SOMA filter would
    // have hidden the probe portfolio entirely.
    const somaRow = page.locator('table tbody tr', { hasText: SOMA_NAME });
    const probeRow = page.locator('table tbody tr', { hasText: probeName });
    await expect(somaRow, 'SOMA row present').toHaveCount(1, { timeout: 10_000 });
    await expect(probeRow, 'fresh probe portfolio renders post-#221 fix')
      .toHaveCount(1, { timeout: 10_000 });
  });
});
