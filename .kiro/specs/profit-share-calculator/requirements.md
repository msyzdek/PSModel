# Requirements Document

## Introduction

The Profit Share Calculator is a web application that calculates and tracks monthly profit share distributions to company shareholders based on QuickBooks Net Income data. The system handles complex adjustments including PS payout add-backs, personal charges, owner draws, share allocations, deficit carry-forwards, and rounding reconciliation. The MVP focuses on manual data entry with a simplified calculation model to enable quick deployment.

## Requirements

### Requirement 1: Monthly Profit Share Calculation

**User Story:** As an admin, I want to calculate monthly profit share distributions based on QuickBooks Net Income and various adjustments, so that shareholders receive accurate payouts.

#### Acceptance Criteria

1. WHEN a user enters monthly data THEN the system SHALL calculate the adjusted pool using the formula: `adjusted_pool = net_income_qb + ps_addback + personal_addback_total - owner_draws`
2. WHEN calculating per-holder allocations THEN the system SHALL compute `pre_share(holder) = adjusted_pool * shares(holder) / total_shares`
3. WHEN determining final payouts THEN the system SHALL calculate `payout_raw(holder) = pre_share(holder) - personal_charges(holder) - carry_forward_in(holder)`
4. WHEN payout_raw is negative THEN the system SHALL set payout to zero AND carry forward the deficit as a positive amount
5. WHEN payout_raw is zero or positive THEN the system SHALL set payout to payout_raw AND set carry_forward_out to zero
6. WHEN all payouts are calculated THEN the system SHALL validate that total_shares > 0 for positive adjusted_pool

### Requirement 2: Input Data Management

**User Story:** As an admin, I want to enter and manage monthly financial data for each period, so that calculations can be performed accurately.

#### Acceptance Criteria

1. WHEN entering monthly data THEN the system SHALL accept net_income_qb (QuickBooks Net Income) as a decimal number
2. WHEN entering monthly data THEN the system SHALL accept ps_addback (PS payout add-back) as a decimal number
3. WHEN entering monthly data THEN the system SHALL accept owner_draws (total owner draws) as a decimal number
4. WHEN entering holder data THEN the system SHALL accept personal_charges per holder as positive decimal numbers
5. WHEN entering holder data THEN the system SHALL accept shares per holder as positive integers
6. WHEN data is entered THEN the system SHALL validate all required fields are present
7. WHEN data is entered THEN the system SHALL validate numeric fields contain valid numbers

### Requirement 3: Deficit Carry-Forward Management

**User Story:** As an admin, I want the system to automatically track and apply deficit carry-forwards from previous months, so that negative payouts are properly offset against future distributions.

#### Acceptance Criteria

1. WHEN a holder has a negative payout THEN the system SHALL carry forward the deficit amount to the next month
2. WHEN calculating current month payout THEN the system SHALL automatically apply carry_forward_in from the prior month's output
3. WHEN displaying holder data THEN the system SHALL show both carry_forward_in and carry_forward_out amounts
4. WHEN a new month is created THEN the system SHALL derive carry_forward_in from the previous month's carry_forward_out
5. WHEN no prior month exists THEN the system SHALL set carry_forward_in to zero

### Requirement 4: Rounding and Reconciliation

**User Story:** As an admin, I want payouts rounded to cents with proper reconciliation, so that the total distributed matches the adjusted pool exactly.

#### Acceptance Criteria

1. WHEN calculating payouts THEN the system SHALL round each payout to cents using round-half-up method
2. WHEN rounding is complete THEN the system SHALL compute the rounding delta between rounded total and unrounded total
3. WHEN a rounding delta exists THEN the system SHALL adjust the holder with the largest positive payout by the delta amount
4. WHEN displaying results THEN the system SHALL show the rounding delta applied
5. WHEN all adjustments are complete THEN the system SHALL validate that sum of rounded payouts equals the rounded adjusted pool

### Requirement 5: Multi-Holder Support

**User Story:** As an admin, I want to manage multiple profit share holders with individual share counts and personal charges, so that each holder receives their correct allocation.

#### Acceptance Criteria

1. WHEN managing holders THEN the system SHALL support multiple holders per month
2. WHEN entering holder data THEN the system SHALL accept unique holder names
3. WHEN entering holder data THEN the system SHALL accept individual share counts per holder
4. WHEN entering holder data THEN the system SHALL accept individual personal charges per holder
5. WHEN calculating distributions THEN the system SHALL process all active holders for the month
6. WHEN displaying results THEN the system SHALL show per-holder breakdown including shares, gross allocation, personal charges, and net payout

### Requirement 6: Period Summary Report

**User Story:** As an admin, I want to view a comprehensive period summary report, so that I can review all calculation components and verify accuracy.

#### Acceptance Criteria

1. WHEN viewing a period summary THEN the system SHALL display pool build-up components (net_income_qb, ps_addback, personal_addback_total, owner_draws)
2. WHEN viewing a period summary THEN the system SHALL display the calculated adjusted_pool
3. WHEN viewing a period summary THEN the system SHALL display total_shares for the period
4. WHEN viewing a period summary THEN the system SHALL display per-holder allocations with shares, gross, personal charges, and net payout
5. WHEN viewing a period summary THEN the system SHALL display carry-forward movements (in and out) per holder
6. WHEN viewing a period summary THEN the system SHALL display the rounding delta and which holder received the adjustment
7. WHEN viewing a period summary THEN the system SHALL display totals for all monetary amounts

### Requirement 7: Data Persistence

**User Story:** As an admin, I want monthly calculation data saved persistently, so that I can review historical periods and maintain accurate records.

#### Acceptance Criteria

1. WHEN monthly data is entered THEN the system SHALL save all input data to persistent storage
2. WHEN calculations are performed THEN the system SHALL save all calculated results to persistent storage
3. WHEN viewing historical data THEN the system SHALL retrieve and display saved monthly records
4. WHEN navigating between months THEN the system SHALL maintain data integrity and relationships
5. WHEN the system restarts THEN the system SHALL retain all previously entered data

### Requirement 8: Admin Access Control (MVP)

**User Story:** As an admin, I want secure access to the application, so that only authorized users can manage profit share calculations.

#### Acceptance Criteria

1. WHEN accessing the application THEN the system SHALL require admin authentication
2. WHEN authenticated THEN the system SHALL allow full access to all features
3. WHEN not authenticated THEN the system SHALL deny access to calculation features
4. WHEN implementing authentication THEN the system SHALL use a simple admin-configured user approach (no SSO in MVP)

### Requirement 9: Adjustments for Special Items

**User Story:** As an admin, I want to account for special adjustments like uncollectible income, bad debt, and tax optimization, so that the profit pool accurately reflects distributable income.

#### Acceptance Criteria

1. WHEN entering monthly data THEN the system SHALL accept uncollectible income amount as a decimal number
2. WHEN entering monthly data THEN the system SHALL accept bad debt amount as a decimal number
3. WHEN entering monthly data THEN the system SHALL accept tax optimization return amount as a decimal number
4. WHEN calculating adjusted pool THEN the system SHALL subtract uncollectible and tax optimization from net income
5. WHEN calculating adjusted pool THEN the system SHALL add bad debt back to net income
6. WHEN displaying pool build-up THEN the system SHALL show all adjustment components separately

### Requirement 10: Month-to-Month Navigation

**User Story:** As an admin, I want to navigate between different months easily, so that I can review and manage multiple periods efficiently.

#### Acceptance Criteria

1. WHEN viewing the application THEN the system SHALL provide navigation to select different months
2. WHEN selecting a month THEN the system SHALL load and display that month's data
3. WHEN creating a new month THEN the system SHALL initialize it with carry-forwards from the previous month
4. WHEN viewing a month THEN the system SHALL clearly indicate the current period (month and year)
5. WHEN no data exists for a month THEN the system SHALL allow creation of a new monthly record
