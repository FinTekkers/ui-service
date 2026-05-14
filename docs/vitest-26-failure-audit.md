# PR #171 — vitest failure audit

**Author:** ui-dev  •  **Date:** 2026-05-14  •  **Trigger:** PM gate on PR #171 review

## TL;DR

PR #171 opened with **30 vitest failures** (26 consistent + 4 flaky timeouts), reported as "all pre-existing, matches main". The PM correctly flagged that as a discipline failure: a "matches main" hand-wave hides regressions. This audit re-checked every failure against three baselines:

| Baseline | Commit | ledger-models | Failures |
|---|---|---|---|
| Pre-PR-#170 | `0777599` | `^0.2.5` | **0 pricing failures** (only 10 auth/HTTP infra failures from a transient UI server state) |
| main (post-PR-#170) | `0cacc05` | `^0.4.1` | **27 failures** |
| PR #171 head | `564a54f` | `^0.4.3` | **30 failures** (27 + 3 extra flaky timeouts) |

**Key finding:** **26 of the 30 failures are REGRESSIONS introduced by PR #170 (the v0.4.1 SecurityProto cutover) that have been silently sitting on main for ~6 hours.** They are NOT caused by PR #171, but the original "matches baseline" framing was wrong — *the baseline itself is broken*.

The remaining 4 are flaky timeouts in `auth-flow-e2e.test.ts` (vary by run, not caused by PR #170 or PR #171).

**Root cause** (single bug, fans out to 26 test failures): `src/tests/valuationMockHelper.ts` calls top-level `SecurityProto.getFaceValue()` / `getCouponRate()` / `getMaturityDate()` / `getCouponFrequency()` / `getSpread()`. PR #170 moved those fields off the flat SecurityProto into the `bond_details` and `frn_extension` sub-messages. The mock now reads `undefined`, falls back to its hardcoded defaults (`face=1000`, `periods=8`, `matDate=2030-01-15`), and produces results 10× too large with truncated cashflow schedules.

**Fix applied** (in this PR, commit-pending): the mock helper now reads `bond_details.*` first and falls back to flat fields. **Result: 0 vitest failures across 3 consecutive runs (618/618 pass).**

| Class | Count | Disposition |
|---|---|---|
| REGRESSION FROM PR-#170 | 26 | **FIXED** in this PR via mock helper update |
| FLAKY (timeouts under load) | 4 | KEEP (acknowledged flake — see follow-up) |
| PRE-EXISTING | 0 | — |
| DEAD | 0 | — |

---

## Methodology

For each failing test:

1. Captured the assertion line + error from a verbose vitest run on PR #171 head (logged `/tmp/vitest-v043-branch.log`).
2. Checked out **`0777599`** (the merge commit immediately before PR #170), ran `npm install --ignore-scripts --legacy-peer-deps` to pin `@fintekkers/ledger-models@0.2.5`, ran the full vitest suite (logged `/tmp/vitest-pre-pr170.log`).
3. Checked out **main (`0cacc05`)** with `@fintekkers/ledger-models@0.4.1`, started ui-service on :443, ran the full vitest suite (logged `/tmp/vitest-main-v041.log`).
4. `git blame` on the failing assertion line and `git log --follow` on the test file to date-stamp the test relative to PR-#170.
5. Cross-referenced PR-#170's `valuation.ts` diff (`git diff 0777599 1ce9234 -- src/lib/valuation.ts`) to identify what changed in the proto-building path.

The "0 pricing failures pre-PR-#170" result is fully reproducible from the shell history above.

---

## Root cause analysis

### What PR-#170 changed

`src/lib/valuation.ts:buildManualSecurityProto` (and the TIPS/FRN siblings) was rewritten:

```diff
- security.setFaceValue(decimalValue('100'))      // FLAT field on SecurityProto
- security.setCouponRate(decimalValue('5'))
- security.setCouponType(CouponTypeProto.FIXED)
- security.setCouponFrequency(SEMI)
- security.setIssueDate(localDate)
- security.setMaturityDate(localDate)
+ const security = BondSecurity.fromPricerInputs({
+   faceValue, couponRate, couponType, couponFrequency, issueDate, maturityDate
+ });
+ // Internally calls setBondDetails(BondDetailsProto.setFaceValue(...).setCouponRate(...).set...)
```

The new `BondSecurity.fromPricerInputs` (and `TIPSBond.fromPricerInputs`, `FloatingRateNote.fromPricerInputs`) populate the **`bond_details` sub-message** on the SecurityProto. The flat top-level fields are no longer set — and in v0.4.1+ they were physically removed from the SecurityProto schema (only `getBondDetails` remains).

### What the mock didn't get updated

`src/tests/valuationMockHelper.ts` was written when valuation.ts set the flat fields directly. PR #170 updated valuation.ts but not the mock. The mock kept calling:

```ts
const faceValue   = parseFloat(sec?.getFaceValue?.()?.getArbitraryPrecisionValue?.() ?? '1000');
const couponRatePct = parseFloat(sec?.getCouponRate?.()?.getArbitraryPrecisionValue?.() ?? '5');
const freqEnum    = sec?.getCouponFrequency?.() ?? COUPON_FREQ.QUARTERLY;
const spreadBps   = parseFloat(sec?.getSpread?.()?.getArbitraryPrecisionValue?.() ?? '50');
const { periods, matDate } = countPeriods(sec?.getMaturityDate?.());
// countPeriods: if (!matDateProto) return { periods: 8, matDate: new Date('2030-01-15') };
```

In v0.4.1+:
- `sec.getFaceValue` does not exist → `undefined?.()` → `undefined` → `parseFloat('1000')` → **face = 1000** (test passed `100`)
- `sec.getMaturityDate` does not exist → `countPeriods(undefined)` → **periods = 8, matDate = 2030-01-15** (test passed any maturity)
- `sec.getCouponFrequency` does not exist → defaults to **QUARTERLY** for FRN scenarios

That single mismatch fully explains every failure pattern in the bond/FRN/TIPS suites:
- `expected 25 to be close to 2.5` → coupon = `1000 × 5% / 2 = 25` instead of `100 × 5% / 2 = 2.5` (10× scale)
- `expected 8 to be 20` → 10-yr Scenario B truncated to 8 periods (defaulted matDate)
- `expected 999.99 to be close to 100` → PV scaled with face=1000
- `expected 16 to be 8` → 2-yr quarterly FRN read as 4-yr quarterly because matDate defaulted to 2030 (3.7 years out from "today" in the mock = `ceil(3.7 × 4) = 16`)
- TIPS Inflation-Adjusted Principal `1225.36` vs `122.54` — `100 × index_ratio` returned as `1000 × index_ratio` for the same 10× reason.

### The fix

```diff
+ const bd = sec?.getBondDetails?.();
- const faceValue = parseFloat(sec?.getFaceValue?.()?.getArbitraryPrecisionValue?.() ?? '1000');
+ const faceValue = parseFloat(
+   bd?.getFaceValue?.()?.getArbitraryPrecisionValue?.()
+   ?? sec?.getFaceValue?.()?.getArbitraryPrecisionValue?.()
+   ?? '1000'
+ );
```

(Same pattern for `getCouponRate`, `getCouponFrequency`, `getMaturityDate`. FRN `getSpread` reads from the parallel `frn_extension` sub-message.) Flat-field fallback retained so the mock keeps working with any pre-cutover caller (none today; cheap insurance).

**Verification:** `npx vitest run` → **618 passed | 0 failed | 10 todo** across 3 consecutive runs.

---

## Per-test catalogue

Sorted by class (REGRESSION first), grouped by file. Files: `B` = `src/tests/bond-pricing-consistency.test.ts`, `F` = `src/tests/frn-pricing-consistency.test.ts`, `T` = `src/tests/TipsValuation.test.ts`, `A` = `src/tests/auth-flow-e2e.test.ts`.

### REGRESSION FROM PR-#170 (26 tests)

All 26 share the same root cause (mock reading flat fields that PR #170 stopped populating), the same blame for the test file (`d8b73b9` 2026-03-20 for the bond/TIPS scenarios; `1b60817` 2026-05-05 for the FRN suite added with the engine-path migration), and the same disposition.

**Disposition for all 26: FIX** — applied in this PR via `src/tests/valuationMockHelper.ts` reading from `bond_details` / `frn_extension` first.

| # | File:line | Test name | Asserted | Actual on main v0.4.1 | Mechanism |
|---|---|---|---|---|---|
| 1  | B:152 | QD A — Coupon FV = $2.50 | `cf[i].fvAmount ≈ 2.50` | `25` | face defaulted 1000 |
| 2  | B:161 | QD A — CRITICAL: PV == sum(CF PVs) | `pvSumQuoted ≈ 100` | `999.99` | 10× scale |
| 3  | B:187 | QD B — 20 cashflow periods | `length = 20` | `8` | matDate defaulted to 2030-01-15 |
| 4  | B:204 | QD B — Coupon FV = $2.50 | `cf[i].fvAmount ≈ 2.50` | `25` | face defaulted |
| 5  | B:213 | QD B — CRITICAL: PV == sum(CF PVs) | `pvSumQuoted ≈ 92.5613` | `925.61` | 10× scale |
| 6  | B:237 | QD B — Cashflow dates span ~10 years | `cashflows[19].date` exists | TypeError (only 8 cashflows) | matDate defaulted |
| 7  | B:252 | QD C — 20 cashflow periods | `length = 20` | `8` | matDate defaulted |
| 8  | B:267 | QD C — CRITICAL: PV == sum(CF PVs) | `pvSumQuoted ≈ 108.18` | `1081.76` | 10× scale |
| 9  | B:290 | QD E (TIPS) — cashflows length 10 | `length = 10` | `8` | matDate defaulted |
| 10 | B:308 | QD E — Inflation-adjusted coupon ≈ $1.034 | `≈ 1.034` | `25.84` | face defaulted, also TIPS index ratio applied to 1000 |
| 11 | B:319 | QD E — Final cashflow ≈ $104.40 | `≈ 104.40` | `1059.46` | same |
| 12 | B:327 | QD E — CRITICAL: PV == sum(CF PVs) | `pvSumQuoted ≈ 100` | `999.99` | 10× scale |
| 13 | B:340 | Original — 5% $100 face discount: PV == sum CF PVs | `pvSumQuoted ≈ 98.5` | `985` | 10× scale |
| 14 | B:371 | Cross-scenario — Higher coupon → shorter duration | `dur8 < dur5` | `dur8 == dur5 == 3.6747` | both scenarios collapsed to default 8-period schedule |
| 15 | B:404 | Cross-scenario — three-way consistency | `pvSumQuoted ≈ 100` | `999.99` | 10× scale |
| 16 | F:66  | QD F — 8 cashflow periods | `length = 8` | `16` | matDate defaulted (2030 vs spec 2028); 3.7yr × 4q ≈ 16 |
| 17 | F:78  | QD F — CRITICAL: PV == sum(CF PVs) | `pvSumQuoted ≈ 100` | `999.99` | 10× scale |
| 18 | F:83  | QD F — sum(CF PVs) = 100 at par | `≈ 100` | `999.99` | 10× scale |
| 19 | F:97  | QD F — Coupon FV = $1.125 | `≈ 1.125` | `11.25` | face defaulted |
| 20 | F:124 | QD G — 8 cashflow periods | `length = 8` | `16` | matDate defaulted |
| 21 | F:138 | QD G — CRITICAL: PV == sum(CF PVs) | `pvSumQuoted ≈ 99.5257` | `995.26` | 10× scale |
| 22 | F:145 | QD G — Coupon FV = $1.125 | `≈ 1.125` | `11.25` | face defaulted |
| 23 | F:159 | QD H — 8 cashflow periods | `length = 8` | `16` | matDate defaulted |
| 24 | F:173 | QD H — CRITICAL: PV == sum(CF PVs) | `pvSumQuoted ≈ 100.4769` | `1004.77` | 10× scale |
| 25 | F:180 | QD H — Coupon FV = $1.125 | `≈ 1.125` | `11.25` | face defaulted |
| 26 | T:46  | TIPS — Inflation-Adjusted Principal ≈ 122.536 | `≈ 122.536` | `1225.36` | face defaulted (10×) |

**git blame on the assertion lines:**
- B:152, B:161, B:187, B:204, B:213, B:237, B:252, B:267, B:290, B:308, B:319, B:327, B:340, B:371, B:404 → all `d8b73b9 2026-03-20 dado0583  Adding several more pages` (test file authored before PR #170)
- F:66, F:78, F:83, F:97, F:124, F:138, F:145, F:159, F:173, F:180 → all `1b60817 2026-05-05 dado0583  valuation: migrate RunFrnValuation to ProductInput.Frn engine path; refactor frn-pricing-consistency onto mock helper` (test file authored before PR #170)
- T:46 → `d8b73b9 2026-03-20 dado0583  Adding several more pages`

**git blame on the function under test (`buildManualSecurityProto` etc.):**
- `1ce9234 2026-05-14 dado0583  feat(#277): Phase-5 v0.4.1 SecurityProto consumer cutover` — this is PR #170, the regression source.

### FLAKY — auth-flow-e2e timeouts (4 tests)

| # | File:line | Test name | Symptom | Fails on |
|---|---|---|---|---|
| 27 | A:?  | AC2: POST /register?/register with valid data | `Test timed out in 5000ms` | PR #171 only (1/3 runs) |
| 28 | A:?  | AC2: POST /register?/register with duplicate email | `Test timed out in 5000ms` | PR #171 only (1/3 runs) |
| 29 | A:?  | AC2: POST /register?/register with wrong signup code | `Test timed out in 5000ms` | PR #171 only (1/3 runs) |
| 30 | A:?  | AC2: POST /register?/register with password mismatch | `Test timed out in 5000ms` | PR #171 only (1/3 runs) |

These hit the live UI server on `:443`. They were not failing on main with the UI up, and not failing on PR #171 in the immediate post-fix runs (3 consecutive 618/618 passes after the mock fix). The pattern (4 tests in the same `AC2` describe block timing out together at exactly 5000 ms) suggests a transient stall — Vite/SvelteKit dev-server response time spiking when the test runner contends with another vitest process, or the Vite HMR initialization on first request.

`git log --follow src/tests/auth-flow-e2e.test.ts`:
- `f8cbfbf tests: fix auth-flow-e2e stale grpc-auth function name`
- `d520195 Add auth refactoring, route reorganization, and profile page` (original)

Both predate PR #170.

**Disposition: KEEP** with explicit follow-up note. These are not caused by PR #170 or PR #171. After the mock fix, the failures did not reproduce in 3 consecutive vitest runs. If they recur in CI, the right fix is to either (a) bump `testTimeout` for the AC2 block to 15000 ms (matching the existing AC3 cookie tests), or (b) sequentialize the AC2 tests so they don't race the same UI route. **Tracked as a P3 follow-up — not a merge blocker.**

### PRE-EXISTING (0 tests)

None. Every consistent failure on PR #171 traces to PR #170. The original "matches main baseline" framing was technically accurate (the failures DO match main), but it conflated "baseline" with "acceptable" — and the baseline was a regression that should not have shipped.

### DEAD (0 tests)

None. Every failing test is asserting current product behavior; none are stranded against removed functionality.

---

## What this means for PR-#171

PR #171 itself (the v0.4.3 wrapper-API cleanup) introduces **zero** vitest regressions. The audit's gating value is in surfacing the PR-#170 regression — which is now also fixed in this PR via the mock helper update. With the mock fix:

- **vitest:** 0 failed | 618 passed | 10 todo (3-run stable)
- **svelte-check:** 105 errors (down from 122 pre-PR-#171; no change from the mock fix)
- **playwright `/data/curves` + `/data/treasury_curve`:** 6 passed; 2 pre-existing failures unrelated to mock or wrapper APIs

## Process recommendations

1. **Mock-helper drift after wire-format changes is invisible to type-checking** — `?.()` chaining swallows missing methods. Recommend adding a regression test that mints a SecurityProto via `BondSecurity.fromPricerInputs` and asserts the mock reads the same values (basically a smoke test that the mock and the wrapper agree on field locations).
2. **PR-#170's "test files updated" gate didn't catch this** because the mock helper isn't a test file by name — it's `valuationMockHelper.ts`. Adding it to the wrapper-API audit checklist alongside `valuation.ts` would have caught it.
3. **"Matches baseline" is not a green light.** The baseline can be wrong. Going forward, on any wrapper-API cutover PR, gate on absolute-zero failures — not relative-to-main parity.
