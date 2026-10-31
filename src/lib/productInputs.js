// US-303: ledger-models' ProductInput builders (LM-410)
// and per-arm measure list (LM-427). Re-exported from a
// .js file typed by productInputs.d.ts so the type checker reads the
// package's declarations, not its shipped product_inputs.ts source.
export {
  armFor,
  checkProductInput,
  forSecurity,
  measuresForArm,
  requiredMarketData,
} from "@fintekkers/ledger-models/node/wrappers/models/security/product_inputs";
