# Profit Share Calculator — Comprehensive Spec Summary

---

## 1. Core: Period Pool Calculation

**Description:** This defines the calculation for the total distributable profit pool for a single period (month), based on the logic in the latest (e.g., `PS Model 2025`) sheets.

### Inputs (Manual, Per-Period)
* `net_income_base`: The starting Net Income (accrual) for the month.
* `ps_payout_addback`: Total PS payouts previously expensed in QBO (added back).
* `personal_charges_total`: The sum of all individual partner personal charges for the period (added back to the pool).
* `owner_draws_total`: Total owner draws, owner-paid salaries, and related off-book payments (subtracted from the pool).
* `tax_optimization_addback`: Adjustments for tax optimization returns (added back).
* `uncollectible_adjustment`: Write-offs for uncollectible income (subtracted).
* `bad_debt_adjustment`: Adjustments for bad debt (subtracted).

### Pool Formula
`adjusted_pool = net_income_base + ps_payout_addback + personal_charges_total - owner_draws_total + tax_optimization_addback - uncollectible_adjustment - bad_debt_adjustment`

---

## 2. Core: Per-Holder Distribution & Carry-Forward

**Description:** Defines how the `adjusted_pool` is distributed, factoring in shares, personal charges, and the net carry-forward balance (which can be positive or negative).

### Inputs (Per-Holder, Per-Period)
* `shares[holder]`: The number of shares for the holder for this period.
* `personal_charges[holder]`: Specific personal charges deducted from this holder's allocation.
* `carry_forward_in[holder]`: The outstanding balance from the prior period, entered for this period.
    * **Positive value** = A deficit (e.g., from a prior period's negative calculation or a manual overdraw).
    * **Negative value** = A credit (e.g., from a manual adjustment).
* **Note:** For subsequent periods, the base `carry_forward_in` will be the `carry_forward_out` from the prior period, but it **must be adjustable** to allow for manual entries.

### Calculation Steps
1.  **Total Shares:**
    * `total_shares = sum(shares[all_holders])`
2.  **Initial Share Allocation:**
    * `pre_share_allocation[holder] = (adjusted_pool * shares[holder]) / total_shares`
    * If `total_shares` is 0, this is 0.
3.  **Raw Payout (Pre-Floor):**
    * `payout_raw[holder] = pre_share_allocation[holder] - personal_charges[holder] - carry_forward_in[holder]`
4.  **Final Payout & Carry-Forward Out:**
    * **If `payout_raw[holder] >= 0`:** (Holder has a net positive balance)
        * `final_payout_unrounded[holder] = payout_raw[holder]`
        * `carry_forward_out[holder] = 0`
    * **If `payout_raw[holder] < 0`:** (Holder is in deficit)
        * `final_payout_unrounded[holder] = 0`
        * `carry_forward_out[holder] = -payout_raw[holder]` (The deficit, as a **positive** number)

---

## 3. Core: Rounding & Reconciliation

**Description:** Ensures that individual payouts are rounded to cents and that the sum of the final rounded payouts exactly equals the total distributable amount.

### Calculation Steps
1.  **Calculate Total Distributable Amount:**
    * `total_payout_unrounded = sum(final_payout_unrounded[all_holders])`
    * `total_payout_rounded_target = round(total_payout_unrounded, 2)` (Round half up)
2.  **Round Individual Payouts:**
    * `final_payout_rounded[holder] = round(final_payout_unrounded[holder], 2)` (Round half up)
3.  **Calculate Rounding Delta:**
    * `total_payout_rounded_actual = sum(final_payout_rounded[all_holders])`
    * `rounding_delta = total_payout_rounded_target - total_payout_rounded_actual`
4.  **Reconcile Delta:**
    * Identify the holder with the **largest** `final_payout_rounded` value.
    * `reconciled_payout[largest_holder] = final_payout_rounded[largest_holder] + rounding_delta`
    * For all other holders, `reconciled_payout[holder] = final_payout_rounded[holder]`
5.  **Final Payout:**
    * The `reconciled_payout[holder]` values are the final, payable amounts for the period.

---

## 4. Data Structure: Periods & Inputs

**Description:** Defines the data entities required to run a calculation, based on discrete, sequential "Periods" (months).

### Entity: Period (Month)
* A "Period" is the smallest unit of calculation (e.g., "Jan 2025").
* Stores its own inputs and outputs.
* Processed sequentially, as `carry_forward_out` from Period `N` is the base `carry_forward_in` for Period `N+1`.

### Per-Period Inputs (Top-Level)
* `period_name`: (e.g., "Jan 2025")
* `net_income_base`: (Currency)
* `ps_payout_addback`: (Currency)
* `owner_draws_total`: (Currency)
* `tax_optimization_addback`: (Currency)
* `uncollectible_adjustment`: (Currency)
* `bad_debt_adjustment`: (Currency)

### Per-Holder Inputs (Per-Period)
* `holder_id`: (Link to holder)
* `period_id`: (Link to period)
* `shares`: (Number)
* `personal_charges`: (Currency)
* `carry_forward_in`: (Currency)
    * Defaults to the `carry_forward_out` of the *immediately preceding period*.
    * **Must be manually overridable** for any period.

---

## 5. Data Structure: Calculation Outputs

**Description:** Defines the outputs that must be stored for each holder for each period for traceability.

### Per-Holder Outputs (Per-Period)
* `holder_id`
* `period_id`
* `pre_share_allocation`
* `payout_raw`
* `final_payout_unrounded`
* `final_payout_rounded`
* `reconciled_payout`
* `carry_forward_out`

### Per-Period Outputs (Totals)
* `adjusted_pool`
* `total_shares`
* `total_payout_unrounded`
* `total_payout_rounded_target`
* `rounding_delta`
* `total_reconciled_payout`
* `total_carry_forward_out`

---

## 6. Application Functionality & Workflow

**Description:** Defines the core user actions for managing the system, inputting data, and running calculations.

### Holder Management
* **Create/Edit Holder:** Ability to add new profit share holders by name.
* **Activate/Deactivate Holder:** Holders can be "Active" or "Inactive". Only "Active" holders appear in new periods. Inactive holders remain in past periods for historical integrity.

### Period Management
* **Create New Period:** Creates the next sequential period (e.g., "Feb 2025" after "Jan 2025").
* **Auto-Populate Carry-Forward:** When a new period is created, the system auto-populates each holder's `carry_forward_in` with the `carry_forward_out` value from the preceding period. This field remains manually overridable.
* **View/Select Period:** UI to navigate between all existing periods.

### Data Entry & Calculation Workflow
1.  Admin selects a Period.
2.  Admin enters top-level Period Inputs.
3.  Admin enters Per-Holder Inputs (`shares`, `personal_charges`).
4.  Admin confirms or overrides the `carry_forward_in` values.
5.  Admin clicks "Calculate".
6.  System executes logic (Sections 1-3) and saves results (Section 5).

### Recalculation (Data Integrity)
* **Automatic Chained Recalculation:** If an input in a past period (e.g., "Jan 2025") is changed, the system **must** automatically trigger a recalculation for "Jan 2025" **and all subsequent periods** (Feb 2025, Mar 2025, etc.) in sequence to ensure data integrity, respecting any subsequent manual overrides of `carry_forward_in`.

---

## 7. Reports & Views

**Description:** Defines the primary screens for data entry and viewing aggregated results.

### View 1: Period Detail / Calculation View
* **Purpose:** The main workspace for data entry and calculation, replicating the individual year sheets.
* **Selector:** User must be able to select the "Period" to view/edit.
* **Layout:** A table with "Active Holders" and a "Total" column.
* **Rows (Inputs):** Top-level pool inputs (`net_income_base`, etc.) and per-holder inputs (`shares`, `personal_charges`, `carry_forward_in`).
* **Rows (Outputs):** Calculated pool values (`adjusted_pool`) and per-holder outputs (`pre_share_allocation`, `reconciled_payout`, `carry_forward_out`).

### View 2: Aggregation Report (Annual/Multi-Year Summary)
* **Purpose:** Replicates the `PM's PS payouts` sheet.
* **Layout:** A summary pivot table.
* **Rows:** "Total Reconciled Payout" and "Total Carry-Forward Out", broken down by holder.
* **Columns:** One column for each Period (e.g., "Jan 2025") and aggregated columns for "Yearly Total" (e.g., "Total 2025").

---

## 8. Access & Authentication

**Description:** Defines user roles and permissions.

### Phase 1 (MVP)
* **Single Admin Mode:** A simple, secure login for one administrative user.
* **Permissions:** This user has full create, read, update, and delete (CRUD) permissions on all data.

### Phase 2 (Future)
* **Authentication:** Google SSO (Workspace).
* **Roles (Google Group-Based):**
    * **Admin:** Full CRUD permissions.
    * **Shareholder (View-Only):** Can log in and view a "My Statement" view (only their own data). Cannot see the main calculation view or other holders' data.