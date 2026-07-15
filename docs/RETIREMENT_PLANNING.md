# Planning toward age 55

`js/retirement-planning-engine.js` provides deterministic, repository-only
scenario outputs for the age-55 planning milestone. It is an educational
illustration, not a prediction, tax calculation, or investment recommendation.

## Method

- Projected investment balance = current investable balance compounded annually
  plus end-of-year annual contributions compounded for the remaining years.
- Baseline, low, and high scenarios use explicit annual return assumptions of
  5%, 3%, and 7% by default. The range is not a probability distribution.
- Target-age spending and healthcare costs are inflated separately. Part-time
  income lowers the required annual cash flow; the mortgage-paid-off scenario
  can additionally remove its modeled payment. Neither changes the investment
  balance projection.
- HSA balance is projected separately from other investments and requires an
  explicit annual HSA contribution assumption.
- Mortgage payoff months use a simple monthly amortization loop from explicit
  balance, payment, and annual-rate fields. If those fields are absent, the
  mortgage output is `not-modeled` and no payoff benefit is assumed.

Every output returns its assumptions and a plain-English explanation. Missing
current age produces `insufficient-data`; other missing planning inputs default
to zero or documented conservative placeholders so the result remains visible
and auditable rather than silently inferred from a balance.

## Boundaries

This engine does not model taxes, Social Security, sequence-of-returns risk,
withdrawal ordering, insurance eligibility, employer match rules, or provider
data freshness. Those require verified source records and a separately reviewed
methodology. No result is deployed or presented as a financial recommendation
by this milestone.

Representative synthetic cases are covered by
`scripts/test-retirement-planning.mjs`.
