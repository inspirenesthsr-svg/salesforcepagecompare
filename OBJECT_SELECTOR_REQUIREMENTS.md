# Object Selector Requirements - Questions

## Questions Before Development

### 1. Object Filtering
- **Q:** Should we show ONLY objects with `leaseworks__` namespace prefix?
- **Q:** Or should we show ALL custom objects (including other namespaces) and filter/search by `leaseworks__`?
- **Q:** Should we include standard objects that might have `leaseworks__` fields?

### 2. Object Display
- **Q:** What information should be shown in the dropdown?
  - API Name (e.g., `leaseworks__Account__c`)
  - Label (e.g., "LeaseWorks Account")
  - Both?
- **Q:** Should we show object count (number of records)?
- **Q:** Should we sort alphabetically by label or API name?

### 3. API Selection
- **Q:** Which Salesforce API should we use to fetch objects?
  - **REST API** (`/services/data/vXX.X/sobjects/`) - Fast, simple
  - **Tooling API** (`/services/data/vXX.X/tooling/query/`) - More detailed metadata
  - **Metadata API** - Most comprehensive but slower
- **Recommendation:** REST API for speed, Tooling API if we need more details

### 4. Caching
- **Q:** Should we cache the objects list?
- **Q:** How long should cache last? (Objects don't change often)
- **Recommendation:** Cache for 1 hour or until user refreshes

### 5. Loading State
- **Q:** What should the loading state show?
  - Simple spinner?
  - "Loading objects..." message?
  - Progress indicator?
- **Q:** Should we show a skeleton/placeholder while loading?

### 6. After Selection
- **Q:** What happens when user selects an object?
  - Just store selection for next phase?
  - Show object details?
  - Navigate to another page?
- **Q:** Should we persist the selection (localStorage/session)?

### 7. Error Handling
- **Q:** What if no objects found with `leaseworks__` prefix?
  - Show message?
  - Show empty state?
- **Q:** What if API call fails?
  - Retry button?
  - Error message?

### 8. UI/UX
- **Q:** Should the dropdown be:
  - Simple HTML select?
  - Searchable dropdown (type to filter)?
  - Multi-select (for future)?
- **Q:** Should we show the namespace prefix in the dropdown or just the object name?

## Assumptions (if no answer)

If you don't specify, I'll implement with these defaults:

1. **Show only objects with `leaseworks__` namespace prefix**
2. **Use REST API** for fetching (fastest)
3. **Display both Label and API Name** (e.g., "LeaseWorks Account (leaseworks__Account__c)")
4. **Sort alphabetically by Label**
5. **Cache for 1 hour**
6. **Simple loading spinner with message**
7. **Store selection in state** (ready for next phase)
8. **Searchable dropdown** (better UX)
9. **Show empty state if no objects found**
10. **Show error message with retry button if API fails**

## Proposed Implementation

### Backend
- New route: `GET /api/salesforce/objects?namespace=leaseworks__`
- Uses REST API to get all objects
- Filters by namespace prefix
- Returns: `{ label, apiName, recordCount }`
- Caches results for 1 hour

### Frontend
- Replace dashboard content with object selector
- Loading state while fetching
- Searchable dropdown
- Shows object label and API name
- Stores selected object in state
- Ready for next phase (extraction)

Please confirm or provide answers to the questions above!

