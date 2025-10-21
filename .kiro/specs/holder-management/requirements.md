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

### Requirement 6: Holder Selection UI

**User Story:** As a user, I want an intuitive interface for selecting holders when creating a period, so that I can quickly set up a new period.

#### Acceptance Criteria

1. WHEN creating a period THEN the system SHALL display a list of active holders with checkboxes
2. WHEN selecting a holder THEN the system SHALL pre-populate their default shares
3. WHEN deselecting a holder THEN the system SHALL remove them from the period
4. WHEN all holders are selected THEN the system SHALL provide a "Select All" option
5. WHEN viewing the selection THEN the system SHALL show holder name, default shares, and status

### Requirement 7: Backward Compatibility

**User Story:** As a user with existing periods, I want the new holder system to work with my historical data, so that I don't lose any information.

#### Acceptance Criteria

1. WHEN the system upgrades THEN it SHALL migrate existing holder names to the master list
2. WHEN viewing old periods THEN the system SHALL display holder information correctly
3. WHEN creating new periods THEN the system SHALL use the new holder management system
4. IF duplicate holder names exist THEN the system SHALL consolidate them into single master records
5. WHEN migration completes THEN the system SHALL preserve all historical calculations and carry-forwards

### Requirement 8: Holder Search and Filter

**User Story:** As a user with many holders, I want to search and filter the holder list, so that I can quickly find specific holders.

#### Acceptance Criteria

1. WHEN viewing the holder list THEN the system SHALL provide a search box
2. WHEN typing in search THEN the system SHALL filter holders by name in real-time
3. WHEN filtering by status THEN the system SHALL show only active or inactive holders
4. WHEN sorting the list THEN the system SHALL allow sorting by name or participation count
5. WHEN no results match THEN the system SHALL display a helpful message

### Requirement 9: Holder Validation

**User Story:** As a user, I want the system to validate holder data, so that I can avoid errors and inconsistencies.

#### Acceptance Criteria

1. WHEN creating a holder THEN the system SHALL prevent duplicate names
2. WHEN entering holder name THEN the system SHALL require non-empty names
3. WHEN setting default shares THEN the system SHALL require positive integer values
4. WHEN creating a period THEN the system SHALL require at least one holder to be selected
5. IF validation fails THEN the system SHALL display clear error messages

### Requirement 10: Holder Analytics

**User Story:** As a user, I want to see holder participation history, so that I can understand holder involvement over time.

#### Acceptance Criteria

1. WHEN viewing a holder THEN the system SHALL show total periods participated
2. WHEN viewing a holder THEN the system SHALL show date range of participation
3. WHEN viewing a holder THEN the system SHALL show total payouts received
4. WHEN viewing a holder THEN the system SHALL show average shares held
5. WHEN viewing a holder THEN the system SHALL provide a link to view all their periods
