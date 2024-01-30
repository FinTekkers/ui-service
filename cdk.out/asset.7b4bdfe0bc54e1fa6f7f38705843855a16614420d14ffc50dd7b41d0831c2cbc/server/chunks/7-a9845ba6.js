import { PortfolioService } from '@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService.js';
import * as dt from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime.js';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter.js';
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';

const { FieldProto } = pkg;
async function load() {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService();
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.PORTFOLIO_NAME, "Federal Reserve SOMA Holdings");
  const portfolioData = portfolioService.searchPortfolio(now.toProto(), filter).then((portfolios) => {
    console.log("Portfolios found: " + portfolios.length);
    const results = portfolios.map((portfolio) => {
      return {
        portfolioName: portfolio.getPortfolioName(),
        portfolioAsOf: portfolio.getAsOf().toString(),
        portfolioId: portfolio.getID().toString()
      };
    });
    return results;
  }).catch((err) => {
    return {
      portfolioName: "Error: " + err.message,
      portfolioAsOf: "",
      portfolioId: ""
    };
  });
  return { portfolioData };
}

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 7;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-cd3e008f.js')).default;
const server_id = "src/routes/portfolios/+page.server.ts";
const imports = ["_app/immutable/nodes/7.72633571.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/store.d6707496.js","_app/immutable/chunks/index.5675a6da.js","_app/immutable/chunks/helper.0e794cd8.js"];
const stylesheets = ["_app/immutable/assets/7.b2708ccc.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-a9845ba6.js.map
