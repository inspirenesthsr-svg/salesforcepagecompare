# Playwright Setup Instructions

## Installation

After adding Playwright to `package.json`, you need to install it:

```bash
cd server
npm install
npx playwright install chromium
```

This will:
1. Install Playwright npm package
2. Download Chromium browser (required for screenshot capture)

## What's Implemented

### Backend Services

1. **Screenshot Service** (`server/services/screenshotService.js`)
   - Uses Playwright to capture full-page screenshots
   - Automatically scrolls to load all content
   - Captures related lists information
   - Extracts record name and metadata

2. **API Endpoints** (`server/routes/salesforce.js`)
   - `GET /api/salesforce/objects/:objectName/records` - List records for object
   - `POST /api/salesforce/records/:recordId/capture` - Capture screenshot
   - `GET /api/salesforce/records/captured` - Get all captured records

### Frontend Components

1. **RecordSelector** - Shows records, allows selection, triggers capture
2. **Updated Dashboard** - Shows object selector → record selector → capture results

## How It Works

1. User selects object → Shows record list
2. User selects record → "Capture Screenshot" button enabled
3. User clicks capture → Playwright:
   - Opens browser
   - Navigates to record URL (with authentication)
   - Scrolls page to load all content
   - Captures full-page screenshot
   - Extracts related lists data
   - Saves screenshot to `screenshots/` folder
4. Stores metadata in session (record URL, screenshot path, related lists)

## Screenshot Storage

- Screenshots saved to: `screenshots/record-{recordId}-{timestamp}.png`
- Metadata stored in session: `req.session.capturedRecords[]`
- Includes: record URL, screenshot path, related lists, record name

## Next Steps

1. Install Playwright: `cd server && npm install && npx playwright install chromium`
2. Restart server
3. Test the flow: Select object → Select record → Capture

## Notes

- Playwright runs in headless mode (no visible browser)
- Screenshots are full-page (captures entire page including below fold)
- Related lists are detected and their record IDs extracted
- All data is session-based (cleared on logout)
