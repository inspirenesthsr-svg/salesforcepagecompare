# Record Capture Requirements

## Questions Before Implementation

### 1. Record Selection
- **Q:** How should user select a record?
  - Show list of records and let user pick one?
  - Auto-select first record?
  - Let user enter record ID?
- **Assumption:** Show list of records, user selects one

### 2. Screenshot Scope
- **Q:** What should be captured?
  - Full page screenshot?
  - Visible viewport only?
  - Multiple screenshots (above fold, below fold, related lists)?
- **Assumption:** Full page + related lists sections

### 3. Related Lists
- **Q:** Should we capture:
  - All related lists on the page?
  - Specific related lists only?
  - Related list data (records) or just screenshots?
- **Assumption:** Screenshot all visible related lists + capture record IDs

### 4. Storage
- **Q:** Where to store screenshots?
  - File system (local)?
  - Database (PostgreSQL)?
  - Both?
- **Assumption:** File system + metadata in database

### 5. Record URL Format
- **Q:** Should we store:
  - Full Salesforce URL?
  - Record ID only?
  - Both?
- **Assumption:** Both (full URL + record ID)

## Implementation Plan

### Backend
1. Install Playwright
2. Create Playwright service for screenshot capture
3. API endpoint: `GET /api/salesforce/objects/:objectName/records` - List records
4. API endpoint: `POST /api/salesforce/records/:recordId/capture` - Capture screenshot
5. Store record URL and screenshot path in database

### Frontend
1. After object selection, show record selector
2. User selects a record
3. Button to "Capture Screenshot"
4. Show loading state during capture
5. Display captured screenshot and record info

### Database
- Store record metadata
- Store screenshot paths
- Link to snapshot (for pre/post comparison)
