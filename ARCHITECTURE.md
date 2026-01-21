# Salesforce Metadata Tracker & Comparison Tool - Architecture Document

## 1. Executive Summary

This document outlines the architecture for a Salesforce Metadata Tracker & Comparison Tool that captures, stores, and compares Salesforce metadata and UI state before and after managed package upgrades. The system uses ReactJS for the frontend, Node.js for the backend, PostgreSQL for data persistence, and integrates with multiple Salesforce APIs.

---

## 2. High-Level System Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth UI    │  │  Capture UI  │  │ Comparison   │         │
│  │  Component   │  │  Component    │  │   Dashboard  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                          ReactJS                                │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
┌────────────────────────────┴────────────────────────────────────┐
│                      Backend API Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth       │  │  Metadata    │  │  Comparison  │         │
│  │  Service     │  │  Service     │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Screenshot │  │   OCR        │  │   Report     │         │
│  │   Service    │  │   Service    │  │   Generator  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                        Node.js/Express                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  PostgreSQL    │  │   Salesforce    │  │   File Storage  │
│   Database     │  │   APIs          │  │   (Screenshots) │
│                │  │                 │  │                 │
│  - Metadata    │  │  - Metadata API │  │  - S3/Local FS  │
│  - Snapshots   │  │  - Tooling API  │  │                 │
│  - Comparisons │  │  - UI API       │  │                 │
│  - Reports     │  │  - REST API     │  │                 │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Component Layers

1. **Presentation Layer (ReactJS)**: User interface for authentication, metadata capture, and comparison visualization
2. **Application Layer (Node.js)**: Business logic, API orchestration, and data processing
3. **Data Layer (PostgreSQL)**: Persistent storage for metadata, snapshots, and comparison results
4. **Integration Layer**: Salesforce API clients and OCR processing
5. **Storage Layer**: File system or object storage for screenshots

---

## 3. Detailed Component Architecture

### 3.1 Frontend Components (ReactJS)

#### 3.1.1 Authentication Module
- **LoginForm**: Collects username, password, security token
- **AuthContext**: Manages authentication state and token storage
- **TokenRefreshHandler**: Automatically refreshes expired tokens

#### 3.1.2 Metadata Capture Module
- **ObjectSelector**: Lists all Salesforce objects
- **RecordSelector**: Lists and allows selection of records for a chosen object
- **CaptureWizard**: Multi-step wizard for initiating capture
- **CaptureProgress**: Real-time progress indicator for capture operations
- **ScreenshotViewer**: Displays captured screenshots

#### 3.1.3 Comparison Module
- **ComparisonDashboard**: Main comparison interface
- **DiffViewer**: Side-by-side or unified diff visualization
- **MetadataTreeView**: Hierarchical view of metadata changes
- **FlexiPageComparator**: Visual comparison of Lightning page layouts
- **ReportViewer**: Displays generated comparison reports

#### 3.1.4 Shared Components
- **API Client**: Axios-based HTTP client with token injection
- **ErrorBoundary**: Global error handling
- **LoadingSpinner**: Reusable loading indicator
- **NotificationSystem**: Toast notifications for user feedback

### 3.2 Backend Services (Node.js)

#### 3.2.1 Authentication Service
**Responsibilities:**
- OAuth 2.0 Username-Password flow implementation
- Token management (storage, refresh, expiration)
- Session management
- Credential validation

**Key Functions:**
- `authenticate(username, password, securityToken, clientId, clientSecret)`
- `refreshToken(refreshToken)`
- `validateToken(accessToken)`
- `revokeToken(accessToken)`

**Security:**
- Credentials never persisted
- Tokens stored in-memory (Redis) or encrypted database
- HTTPS-only communication
- Token expiration monitoring

#### 3.2.2 Metadata Service
**Responsibilities:**
- Orchestrates metadata retrieval from Salesforce APIs
- Handles API rate limiting
- Manages batch operations
- Transforms Salesforce responses to normalized format

**Key Functions:**
- `listObjects(accessToken, instanceUrl)`
- `getObjectMetadata(objectName, accessToken, instanceUrl)`
- `getRecordMetadata(recordId, objectName, accessToken, instanceUrl)`
- `getFlexiPageMetadata(flexiPageId, accessToken, instanceUrl)`
- `getFlowMetadata(flowName, accessToken, instanceUrl)`
- `getRecordTypeMetadata(objectName, accessToken, instanceUrl)`
- `getPageLayoutMetadata(layoutId, accessToken, instanceUrl)`

**API Strategy:**
- **Metadata API**: Custom objects, fields, record types, page layouts, flows
- **Tooling API**: FlexiPage (Lightning Record Page) metadata, component structure
- **UI API**: Record data, field metadata, UI state
- **REST API**: Record retrieval, query operations

#### 3.2.3 Screenshot Service
**Responsibilities:**
- Captures UI screenshots using headless browser (Puppeteer)
- Manages browser instances
- Handles Salesforce authentication in browser context
- Stores screenshots to file system or object storage

**Key Functions:**
- `captureRecordPage(recordId, objectName, accessToken, instanceUrl)`
- `captureFlexiPage(flexiPageId, accessToken, instanceUrl)`
- `storeScreenshot(screenshotBuffer, snapshotId, recordId)`

**Technology:**
- Puppeteer for headless Chrome
- Session cookie injection for authenticated requests
- Screenshot optimization (compression, format)

#### 3.2.4 OCR Service
**Responsibilities:**
- Extracts text from screenshots
- Identifies UI components from visual analysis
- Supports FlexiPage component detection
- Provides structured output for comparison

**Key Functions:**
- `extractTextFromScreenshot(screenshotPath)`
- `detectComponents(screenshotPath, metadata)`
- `compareScreenshots(preScreenshot, postScreenshot)`

**Technology:**
- Tesseract.js for OCR
- Image processing for component detection
- Used as supporting layer, not source of truth

#### 3.2.5 Comparison Service
**Responsibilities:**
- Performs deep comparison of metadata snapshots
- Generates diff reports
- Identifies changes in structure and values
- Creates human-readable reports

**Key Functions:**
- `compareSnapshots(preSnapshotId, postSnapshotId)`
- `compareMetadata(preMetadata, postMetadata)`
- `compareFlexiPages(preFlexiPage, postFlexiPage)`
- `generateDiffReport(comparisonResult)`
- `generateHumanReadableReport(comparisonResult)`

**Comparison Algorithms:**
- Deep object comparison with change tracking
- Field-level diff (type, default, required, length)
- Picklist value diff (additions, removals, reordering)
- Record type diff (assignments, defaults)
- Flow diff (version, logic changes)
- FlexiPage component diff (additions, removals, reordering, property changes)

#### 3.2.6 Snapshot Service
**Responsibilities:**
- Manages snapshot lifecycle
- Coordinates capture operations
- Ensures data consistency
- Handles versioning

**Key Functions:**
- `createSnapshot(orgId, version, description)`
- `saveMetadataSnapshot(snapshotId, objectName, recordId, metadata)`
- `saveScreenshotReference(snapshotId, recordId, screenshotPath)`
- `getSnapshot(snapshotId)`
- `listSnapshots(orgId)`

### 3.3 Database Schema (PostgreSQL)

#### 3.3.1 Core Tables

**organizations**
```sql
- id (UUID, PK)
- name (VARCHAR)
- instance_url (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**snapshots**
```sql
- id (UUID, PK)
- organization_id (UUID, FK → organizations.id)
- version (VARCHAR) -- 'pre-upgrade' or 'post-upgrade' or custom version
- description (TEXT)
- created_at (TIMESTAMP)
- created_by (VARCHAR)
```

**metadata_snapshots**
```sql
- id (UUID, PK)
- snapshot_id (UUID, FK → snapshots.id)
- object_name (VARCHAR)
- record_id (VARCHAR)
- metadata_type (VARCHAR) -- 'object', 'record', 'flexipage', 'flow', 'layout'
- metadata_json (JSONB)
- created_at (TIMESTAMP)
- UNIQUE(snapshot_id, object_name, record_id, metadata_type)
```

**screenshots**
```sql
- id (UUID, PK)
- snapshot_id (UUID, FK → snapshots.id)
- record_id (VARCHAR)
- object_name (VARCHAR)
- screenshot_path (VARCHAR)
- ocr_text (TEXT) -- Optional, for searchability
- created_at (TIMESTAMP)
- UNIQUE(snapshot_id, record_id)
```

**comparisons**
```sql
- id (UUID, PK)
- pre_snapshot_id (UUID, FK → snapshots.id)
- post_snapshot_id (UUID, FK → snapshots.id)
- comparison_type (VARCHAR) -- 'metadata', 'flexipage', 'full'
- diff_json (JSONB)
- report_html (TEXT)
- report_json (JSONB)
- created_at (TIMESTAMP)
```

**comparison_details**
```sql
- id (UUID, PK)
- comparison_id (UUID, FK → comparisons.id)
- object_name (VARCHAR)
- record_id (VARCHAR)
- change_type (VARCHAR) -- 'added', 'removed', 'modified'
- change_path (VARCHAR) -- JSON path to changed field
- pre_value (JSONB)
- post_value (JSONB)
- severity (VARCHAR) -- 'critical', 'warning', 'info'
```

#### 3.3.2 Indexes
- `idx_snapshots_org_version` on `snapshots(organization_id, version)`
- `idx_metadata_snapshots_lookup` on `metadata_snapshots(snapshot_id, object_name, record_id)`
- `idx_comparisons_snapshots` on `comparisons(pre_snapshot_id, post_snapshot_id)`
- `idx_comparison_details_comparison` on `comparison_details(comparison_id)`
- GIN index on `metadata_json` for JSON queries
- GIN index on `diff_json` for JSON queries

#### 3.3.3 Data Normalization Strategy
- Metadata stored as JSONB for flexibility and queryability
- Normalized structure for snapshots and comparisons
- Referential integrity maintained through foreign keys
- Soft deletes via `deleted_at` timestamp (optional)

---

## 4. API Design

### 4.1 REST API Endpoints

#### Authentication
- `POST /api/auth/login` - Authenticate with Salesforce
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Revoke token and clear session
- `GET /api/auth/status` - Check authentication status

#### Objects & Records
- `GET /api/salesforce/objects` - List all objects
- `GET /api/salesforce/objects/:objectName/records` - List records for object
- `GET /api/salesforce/objects/:objectName/records/:recordId` - Get record details

#### Snapshots
- `POST /api/snapshots` - Create new snapshot
- `GET /api/snapshots` - List all snapshots
- `GET /api/snapshots/:snapshotId` - Get snapshot details
- `POST /api/snapshots/:snapshotId/capture` - Initiate capture for snapshot
- `GET /api/snapshots/:snapshotId/status` - Get capture progress

#### Metadata Capture
- `POST /api/capture/metadata` - Capture metadata for object/record
- `POST /api/capture/screenshot` - Capture screenshot for record
- `GET /api/capture/:captureId/status` - Get capture job status

#### Comparisons
- `POST /api/comparisons` - Create comparison between snapshots
- `GET /api/comparisons/:comparisonId` - Get comparison results
- `GET /api/comparisons/:comparisonId/report` - Get human-readable report
- `GET /api/comparisons/:comparisonId/diff` - Get JSON diff

### 4.2 API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid"
  }
}
```

---

## 5. Data Flow

### 5.1 Authentication Flow
```
User Input (username, password, token)
    ↓
Frontend → POST /api/auth/login
    ↓
Backend → Salesforce OAuth Endpoint
    ↓
Salesforce → Access Token + Instance URL
    ↓
Backend → Store token (in-memory/encrypted)
    ↓
Backend → Return token to frontend
    ↓
Frontend → Store token in secure storage (sessionStorage)
```

### 5.2 Pre-Upgrade Capture Flow
```
User selects object
    ↓
Frontend → GET /api/salesforce/objects/:objectName/records
    ↓
Backend → Query Salesforce (REST API)
    ↓
User selects record
    ↓
Frontend → POST /api/snapshots (create pre-upgrade snapshot)
    ↓
Frontend → POST /api/snapshots/:id/capture
    ↓
Backend → Parallel execution:
    ├─ Metadata API → Object metadata
    ├─ Tooling API → FlexiPage metadata
    ├─ UI API → Record data
    ├─ REST API → Record details
    └─ Screenshot Service → UI screenshot
    ↓
Backend → Store in PostgreSQL
    ↓
Backend → Return capture status
```

### 5.3 Post-Upgrade Capture Flow
```
User initiates post-upgrade capture
    ↓
Frontend → POST /api/snapshots (create post-upgrade snapshot)
    ↓
Backend → Retrieve pre-upgrade snapshot records
    ↓
Backend → For each record:
    ├─ Capture metadata (same APIs)
    ├─ Capture screenshot
    └─ Store with post-upgrade version
    ↓
Backend → Mark snapshot as complete
```

### 5.4 Comparison Flow
```
User selects pre & post snapshots
    ↓
Frontend → POST /api/comparisons
    ↓
Backend → Load both snapshots from database
    ↓
Backend → Comparison Service:
    ├─ Compare metadata (deep diff)
    ├─ Compare FlexiPages (structure + OCR)
    ├─ Compare flows
    └─ Generate diff JSON
    ↓
Backend → Generate human-readable report
    ↓
Backend → Store comparison results
    ↓
Backend → Return comparison ID
    ↓
Frontend → GET /api/comparisons/:id
    ↓
Frontend → Render diff visualization
```

---

## 6. Salesforce API Usage Strategy

### 6.1 API Selection Matrix

| Metadata Type | Primary API | Fallback API | Notes |
|--------------|-------------|--------------|-------|
| Custom Objects | Metadata API | Tooling API | Metadata API preferred for structure |
| Fields | Metadata API | Tooling API | Includes field types, defaults |
| Record Types | Metadata API | Tooling API | Includes assignments |
| Page Layouts | Metadata API | Tooling API | Layout assignments |
| FlexiPages | Tooling API | UI API | Lightning pages |
| Flows | Metadata API | Tooling API | Flow definitions |
| Record Data | REST API | UI API | Actual record values |
| UI State | UI API | Screenshot | Current UI rendering |

### 6.2 Rate Limiting Strategy

**Salesforce API Limits:**
- REST API: 15,000 requests/day (Enterprise)
- Metadata API: 10,000 requests/day
- Tooling API: 5,000 requests/day
- UI API: 5,000 requests/day

**Handling Strategy:**
- Implement request queuing
- Exponential backoff on 429 errors
- Batch operations where possible
- Cache metadata when appropriate
- Progress tracking for long operations
- User notification on limit approaching

### 6.3 Error Handling

**Common Errors:**
- `401 Unauthorized`: Token expired → Refresh token
- `403 Forbidden`: Insufficient permissions → User notification
- `429 Too Many Requests`: Rate limit → Queue and retry
- `500 Internal Server Error`: Salesforce issue → Retry with backoff
- `INVALID_FIELD`: Field not accessible → Log and continue

**Retry Strategy:**
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 3
- Idempotent operations only

---

## 7. Security Considerations

### 7.1 Authentication Security
- **Credential Handling**: Never store user credentials; use only for token exchange
- **Token Storage**: 
  - Backend: In-memory (Redis) with TTL or encrypted database
  - Frontend: SessionStorage (cleared on browser close)
- **Token Transmission**: HTTPS only, never in URL parameters
- **Token Refresh**: Automatic refresh before expiration
- **Session Management**: Server-side session validation

### 7.2 Data Security
- **Encryption at Rest**: Encrypt sensitive metadata in database
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Access Control**: Role-based access to snapshots and comparisons
- **Audit Logging**: Log all authentication and data access events
- **Data Retention**: Configurable retention policies for snapshots

### 7.3 API Security
- **Input Validation**: Validate all user inputs
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Prevention**: Sanitize all user-generated content
- **CORS Configuration**: Restrict to trusted origins
- **Rate Limiting**: Implement API rate limiting on backend

### 7.4 Salesforce Security
- **Connected App**: Use least privilege OAuth scopes
- **IP Restrictions**: Configure IP restrictions on Connected App (optional)
- **Token Revocation**: Implement token revocation on logout
- **Permission Validation**: Verify user has required Salesforce permissions

---

## 8. Comparison Algorithm Design

### 8.1 Metadata Comparison

**Algorithm: Deep Recursive Comparison**
```
function compareMetadata(pre, post, path = ""):
    changes = []
    
    if pre == null and post != null:
        changes.append({type: "added", path, value: post})
    else if pre != null and post == null:
        changes.append({type: "removed", path, value: pre})
    else if typeof pre == "object" and typeof post == "object":
        allKeys = union(pre.keys, post.keys)
        for key in allKeys:
            changes.extend(compareMetadata(pre[key], post[key], path + "." + key))
    else if pre != post:
        changes.append({type: "modified", path, preValue: pre, postValue: post})
    
    return changes
```

**Field-Specific Comparisons:**
- **Type Changes**: Critical severity
- **Default Value Changes**: Warning severity
- **Required Flag Changes**: Critical severity
- **Length Changes**: Warning severity
- **Picklist Value Changes**: Info severity (track additions/removals)

### 8.2 FlexiPage Comparison

**Structure Comparison:**
1. Extract component tree from Tooling API metadata
2. Compare component IDs, types, properties
3. Detect additions, removals, reordering
4. Compare component properties (visibility, styling)

**Visual Comparison (OCR Support):**
1. Extract text regions from screenshots
2. Compare text content and positions
3. Identify component boundaries
4. Cross-reference with metadata structure

**Output Format:**
```json
{
  "components": {
    "added": [...],
    "removed": [...],
    "modified": [...],
    "reordered": [...]
  },
  "properties": {
    "changed": [...]
  }
}
```

### 8.3 Flow Comparison

**Comparison Strategy:**
1. Compare flow API version
2. Compare flow structure (elements, decisions, assignments)
3. Compare flow logic (formulas, conditions)
4. Identify version changes

**Output:**
- Version diff
- Element changes
- Logic changes with before/after values

---

## 9. Technology Stack Details

### 9.1 Frontend
- **Framework**: React 18+
- **State Management**: React Context API + useReducer (or Redux Toolkit if complex)
- **HTTP Client**: Axios
- **UI Components**: Material-UI or Ant Design
- **Routing**: React Router
- **Build Tool**: Vite or Create React App
- **Testing**: Jest + React Testing Library

### 9.2 Backend
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js
- **Database Client**: pg (node-postgres) or Prisma
- **ORM/Query Builder**: Prisma (recommended) or Knex.js
- **Authentication**: Custom OAuth 2.0 implementation
- **Screenshot**: Puppeteer
- **OCR**: Tesseract.js
- **Job Queue**: Bull (Redis-based) for async operations
- **Caching**: Redis (optional, for token storage)
- **Validation**: Joi or Zod
- **Logging**: Winston or Pino

### 9.3 Database
- **RDBMS**: PostgreSQL 14+
- **Extensions**: pg_trgm (for text search), btree_gin (for JSONB indexes)

### 9.4 DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose (development)
- **Environment Management**: dotenv
- **Version Control**: Git

---

## 10. Scalability Considerations

### 10.1 Large Org Handling
- **Pagination**: Implement pagination for object/record listing
- **Batch Processing**: Process captures in batches
- **Async Operations**: Use job queue for long-running operations
- **Progress Tracking**: Real-time progress updates via WebSocket or polling
- **Incremental Capture**: Allow selective object/record capture

### 10.2 Performance Optimization
- **Database Indexing**: Strategic indexes on frequently queried columns
- **Caching**: Cache object metadata (changes infrequently)
- **Connection Pooling**: Database connection pooling
- **Parallel API Calls**: Concurrent Salesforce API calls where possible
- **Lazy Loading**: Load comparison results on demand

### 10.3 Storage Optimization
- **Screenshot Compression**: Compress screenshots (JPEG quality 80-85%)
- **Metadata Compression**: Gzip compression for large JSONB fields
- **Cleanup Jobs**: Automated cleanup of old snapshots
- **Archival**: Archive old comparisons to cold storage

---

## 11. Error Handling & Resilience

### 11.1 Error Categories
1. **Authentication Errors**: Token expiration, invalid credentials
2. **API Errors**: Rate limits, Salesforce errors, network issues
3. **Data Errors**: Invalid data, missing records, schema changes
4. **System Errors**: Database failures, file system errors

### 11.2 Error Recovery
- **Automatic Retry**: For transient errors (network, rate limits)
- **Manual Retry**: User-initiated retry for failed operations
- **Partial Success**: Continue processing on non-critical failures
- **Error Reporting**: Detailed error logs with context

### 11.3 Monitoring & Alerting
- **Health Checks**: API health endpoints
- **Logging**: Structured logging (JSON format)
- **Metrics**: Capture operation metrics (duration, success rate)
- **Alerts**: Alert on critical errors or system issues

---

## 12. Limitations & Assumptions

### 12.1 Limitations
1. **API Rate Limits**: Subject to Salesforce API limits; large orgs may require extended capture time
2. **Screenshot Accuracy**: Screenshots may not capture dynamic content or user-specific customizations
3. **OCR Accuracy**: OCR is supporting layer; may have accuracy limitations with complex layouts
4. **Metadata Access**: Limited to metadata accessible via APIs (no direct database access)
5. **Real-time Changes**: Cannot detect changes made outside the tool
6. **Managed Package Internals**: Limited visibility into managed package internal metadata
7. **UI Customization**: User-specific UI customizations may not be captured

### 12.2 Assumptions
1. **Salesforce Access**: User has appropriate Salesforce permissions (View All Data, Modify All Data, or custom permissions)
2. **Connected App**: Connected App is properly configured with required OAuth scopes
3. **Network Access**: Backend has network access to Salesforce instance
4. **Browser Automation**: Headless browser can access Salesforce (may require VPN for some orgs)
5. **Data Consistency**: Salesforce metadata is consistent during capture window
6. **Record Persistence**: Records exist in both pre and post-upgrade states

### 12.3 Known Constraints
- **No Direct Database Access**: Must use Salesforce APIs exclusively
- **OCR as Supporting Layer**: OCR complements metadata, not replaces it
- **Screenshot Limitations**: Screenshots are visual reference, not source of truth
- **API Versioning**: Salesforce API versions may change; tool must handle version differences

---

## 13. Deployment Architecture

### 13.1 Development Environment
```
Frontend (React) → Backend (Node.js) → PostgreSQL (Local)
                                    → Salesforce (Sandbox)
```

### 13.2 Production Environment
```
┌─────────────┐
│   CDN/      │
│  Frontend   │
└──────┬──────┘
       │ HTTPS
┌──────▼──────┐      ┌──────────────┐
│   Load      │      │   Redis      │
│  Balancer   │◄────►│  (Cache/     │
└──────┬──────┘      │   Queue)     │
       │             └──────────────┘
┌──────▼──────┐
│   Backend   │      ┌──────────────┐
│   (Node.js) │◄────►│  PostgreSQL  │
└──────┬──────┘      └──────────────┘
       │
┌──────▼──────┐      ┌──────────────┐
│  File       │      │  Salesforce   │
│  Storage    │      │  APIs        │
│  (S3/FS)    │      └──────────────┘
└─────────────┘
```

### 13.3 Environment Variables
```env
# Salesforce OAuth
SF_CLIENT_ID=
SF_CLIENT_SECRET=
SF_LOGIN_URL=https://login.salesforce.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Server
PORT=3000
NODE_ENV=production
JWT_SECRET=

# File Storage
STORAGE_TYPE=s3|local
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

---

## 14. Testing Strategy

### 14.1 Unit Tests
- Service layer functions
- Comparison algorithms
- Data transformation utilities
- Error handling logic

### 14.2 Integration Tests
- API endpoints
- Database operations
- Salesforce API interactions (mocked)
- End-to-end capture flow

### 14.3 E2E Tests
- Complete user workflows
- Authentication flow
- Capture and comparison workflows

---

## 15. Future Enhancements

1. **Multi-Org Support**: Compare metadata across different orgs
2. **Scheduled Captures**: Automated pre-upgrade captures
3. **Change Tracking**: Track changes over time (not just pre/post)
4. **Export Options**: Export reports in multiple formats (PDF, Excel)
5. **Collaboration**: Share comparisons with team members
6. **Notifications**: Email notifications on capture completion
7. **API Webhooks**: Webhook support for external integrations
8. **Advanced Analytics**: Trend analysis, change impact assessment

---

## 16. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup (frontend + backend)
- Database schema implementation
- Authentication service
- Basic Salesforce API integration

### Phase 2: Capture (Weeks 3-4)
- Metadata capture service
- Screenshot service
- Snapshot management
- Frontend capture UI

### Phase 3: Comparison (Weeks 5-6)
- Comparison algorithms
- Diff generation
- Report generation
- Frontend comparison UI

### Phase 4: Polish (Weeks 7-8)
- Error handling improvements
- Performance optimization
- UI/UX enhancements
- Testing and bug fixes

---

## 17. Conclusion

This architecture provides a scalable, secure, and maintainable foundation for the Salesforce Metadata Tracker & Comparison Tool. The modular design allows for incremental development and future enhancements while maintaining clear separation of concerns and adherence to security best practices.

The system prioritizes Salesforce API data over UI scraping, uses OCR as a supporting layer, and implements robust error handling and rate limiting to handle large Salesforce orgs effectively.

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-01  
**Author**: System Architect

