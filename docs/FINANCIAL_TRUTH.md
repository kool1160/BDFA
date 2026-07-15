# Financial truth outputs

`js/financial-truth-engine.js` computes the current derived financial picture
from the Unified Financial Model. It is deterministic, side-effect free, and
does not persist derived values.

The output includes net worth, cash after recurring bills, recurring income and
bills, available-to-allocate cash, transaction totals, portfolio allocation,
investment contributions and gains, HSA/401(k) contribution fields, and
liability payoff progress.

Source records remain authoritative. Investment contribution and gain totals are
only reported when investment transaction records identify those activities;
the engine does not infer performance from a balance alone. Negative account
balances are treated as account-level debt, while normalized liability records
are subtracted separately. A future adapter must avoid representing the same
liability in both collections.

Representative calculations are covered by `scripts/test-financial-truth.mjs`.
