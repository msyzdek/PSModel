# Requirements Document: Holder Management System

## Introduction

The current Profit Share Calculator requires users to manually enter holder information (name, shares, personal charges) for each period. This is inefficient because:

1. Holders typically remain consistent across periods
2. Only personal charges and occasionally shares change month-to-month
3. Re-entering the same holder names is error-prone and time-consuming

This feature will introduce a persistent holder management system where holders are defined once and can be reused across periods, with only variable data (personal charges, shares) being updated per period.

## Requirements

### Requirement 1: Holder Master List

**User Story:** As a user, I want to maintain a master list of holders, so that I don't have to re-enter holder names for each period.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL provide a way to manage a master list of holders
2. WHEN a user creates a new holder THEN the system SHALL store the holder name persistently
3. WHEN a user views the holder list THEN the system SHALL display all active holders
4. WHEN a user creates a period THEN the system SHALL allow selection from the master holder list
5. IF a holder is no longer active THEN the system SHALL allow marking them as inactive without deleting historical data

### Requirement 2: Holder Information Separation

**User Story:** As a user, I want holder names to be separate from period-specific data, so that I can easily update shares and charges without re-entering names.

#### Acceptance Criteria

1. WHEN defining a holder THEN the system SHALL store only the holder name in the master list
2. WHEN creating a period THEN the system SHALL allow entering shares and personal charges for each selected holder
3. WHEN a holder's shares change THEN the system SHALL allow updating shares for that period without affecting other periods
4. WHEN viewing historical periods THEN the system SHALL display the shares and charges that were used for that specific period

### Requirement 3: Holder Reuse Across Periods

**User Story:** As a user, I want to copy holder information from the previous period, so that I can quickly create a new period with minimal data entry.

#### Acceptance Criteria

1. WHEN creating a new period THEN the system SHALL offer to copy holders from the most recent period
2. WHEN copying from previous period THEN the system SHALL include holder names, shares, and personal charges
3. WHEN copying from previous period THEN the system SHALL allow modifying any copied values before saving
4. IF no previous period exists THEN the system SHALL allow selecting holders from the master list
5. WHEN a new holder joins THEN the system SHALL allow adding them to the master list and the current period

### Requirement 4: Holder CRUD Operations

**User Story:** As a user, I want to create, read, update, and delete holders in the master list, so that I can maintain accurate holder information.

#### Acceptance Criteria

1. WHEN creating a holder THEN the system SHALL require a unique holder name
2. WHEN updating a holder name THEN the system SHALL update the name across all periods
3. WHEN deleting a holder THEN the system SHALL prevent deletion if the holder is used in any period
4. WHEN marking a holder inactive THEN the system SHALL hide them from new period creation but preserve historical data
5. WHEN viewing holder details THEN the system SHALL show which periods the holder participated in

### Requirement 5: Default Shares Management

**User Story:** As a user, I want to set default shares for each holder, so that I don't have to enter the same share count repeatedly.

#### Acceptance Criteria

1. WHEN creating a holder THEN the system SHALL allow setting default shares
2. WHEN creating a new period THEN the system SHALL pre-populate shares with the holder's default value
3. WHEN a holder's shares change permanently THEN the system SHALL allow updating the default shares
4. WHEN updating default shares THEN the system SHALL NOT affect existing periods
5. IF no default shares are set THEN the system SHALL require entering shares for each period

### Requirement 6: Bulk Period Entry Interface

**User Story:** As a user, I want to view and edit multiple periods in a spreadsheet-like interface, so that I can efficiently manage monthly data without opening separate wizards for each period.

#### Acceptance Criteria

1. WHEN viewing the period entry page THEN the system SHALL display a table with holders as rows and months as columns
2. WHEN viewing the table THEN the system SHALL show the most recent 12 months by default
3. WHEN clicking on a cell THEN the system SHALL allow inline editing of shares and personal charges
4. WHEN editing a cell THEN the system SHALL save changes automatically or with a single save action
5. WHEN scrolling horizontally THEN the system SHALL allow viewing additional months
6. WHEN a holder is added THEN the system SHALL add a new row to the table
7. WHEN viewing the table THEN the system SHALL highlight cells with unsaved changes
8. WHEN a period doesn't exist THEN the system SHALL show empty cells that can be filled in
9. WHEN hovering over a cell THEN the system SHALL show a tooltip with calculation details
10. WHEN viewing the table THEN the system SHALL freeze the holder name column for easy scrolling

### Requirement 7: Spreadsheet-Style Multi-Period View

**User Story:** As a user, I want to view and edit multiple periods in a spreadsheet-like table, so that I can efficiently manage data across months without opening separate wizards.

#### Acceptance Criteria

1. WHEN viewing the period management page THEN the system SHALL display a table with holders as rows and months as columns
2. WHEN viewing the table THEN the system SHALL show the most recent 12 months by default
3. WHEN clicking on a cell THEN the system SHALL allow inline editing of that holder's data for that month
4. WHEN editing a cell THEN the system SHALL show inputs for shares and personal charges
5. WHEN saving changes THEN the system SHALL recalculate affected periods automatically
6. WHEN a period doesn't exist THEN the system SHALL show empty cells that can be filled to create the period
7. WHEN viewing the table THEN the system SHALL freeze the holder name column for horizontal scrolling
8. WHEN viewing the table THEN the system SHALL show calculated payouts in each cell (read-only)
9. WHEN hovering over a cell THEN the system SHALL show a tooltip with calculation breakdown
10. WHEN clicking a month header THEN the system SHALL allow editing period-level data (net income, draws, etc.)


