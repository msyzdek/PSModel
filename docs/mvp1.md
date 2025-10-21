# Profit Share Calculator — MVP Spec

This MVP implements monthly profit share with a simplified scope to ship quickly:

- Basis: QuickBooks Net Income (accrual), monthly periods.
- PS payouts expensed in QBO: added back via a single manual field per month (`ps_addback`).
- Personal charges: monthly per-holder amounts. The total is added back to the pool and deducted from the respective holder only.
- Owner salary: a single monthly number per month (`owner_salary`), subtracted from the pool for everyone (no schedules in MVP).
- Shares: fixed per month per holder (no intra-month changes).
- Negative payouts: zero floor; deficits carry forward to offset future months (no invoicing). Carry-forward is derived from the prior month, not user-entered.
- Rounding: round half up to cents; reconcile rounding delta to the largest positive payout.
- No period finalization/locking in MVP; periods remain editable.

## Calculation

Definitions for a period (month):

- `net_income_qb`: Net Income from QBO (accrual) for the month.
- `ps_addback`: manual number to add back PS payouts that were booked as expense in QBO.
- `personal_charges[holder]`: monthly per-holder amounts (positive numbers) for this month.
- `owner_salary`: total owner salary/off-book draws for the month, subtracted from the pool.
- `shares[holder]`: per-holder share count for the month.
- `carry_forward_in[holder]`: deficit (positive number) carried into this month, derived from the prior month’s output (system-provided, not user input).

Pool build-up:

- `personal_addback_total = sum(personal_charges)`
- `adjusted_pool = net_income_qb + ps_addback + personal_addback_total - owner_salary`

Per-holder:

- `pre_share(holder) = adjusted_pool * shares(holder) / total_shares`
- `payout_raw(holder) = pre_share(holder) - personal_charges(holder) - carry_forward_in(holder)`
- Zero floor & carry-forward:
  - If `payout_raw >= 0`: `payout = payout_raw`, `carry_forward_out = 0`.
  - If `payout_raw < 0`: `payout = 0`, `carry_forward_out = -payout_raw` (a positive deficit amount).

Rounding:

- Round each `payout(holder)` to cents using round half up.
- Compute rounding delta vs. the unrounded total paid. Adjust the holder with the largest positive payout by the delta so that rounded payouts sum to the rounded total.

Notes:

- Personal charges are added to the pool (so others are not penalized) and then deducted from the specific holder only.
- Owner salary reduces the pool for everyone (as if expensed in QBO).

Validation:

- Shares must be defined for each participating holder for the month.
- `total_shares > 0` when distributing a positive `adjusted_pool`.
- No intra-month share changes (single monthly value per holder).
- Inputs are month-keyed; no per-transaction date checks or effective-dated schedules in MVP.

## Access & Auth (MVP)

- Single admin mode: an admin-configured user manages inputs and runs calculations.
- No SSO or group checks in MVP.
- Later: Google SSO (Workspace) and Google Group–based roles (admins via 'PM', shareholders via 'shareholders', cached).

## Reports

- Period Summary (MVP): pool build-up (components), total shares, per-holder allocations, carry-forward movement, rounding delta, totals.
- Later: Holder Statement per holder and CSV exports.

## Not in MVP (future)

- Google SSO and Google Group–based access control.
- Holder Statements and CSV exports.
- Prior-period adjustments workflow and deltas.
- QuickBooks API integration (start with CSV numbers).
- Account mapping for Operating Income (we’re using Net Income for now).
- Handling of bad debt, tax optimizations and uncollectible income.
