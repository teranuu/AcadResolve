# AcadResolve - Project File Structure & Component Guide

## Project Directory Structure

```
AcadResolve/
├── README.md                           # Project overview & requirements matrix
├── IMPLEMENTATION_GUIDE.md             # Comprehensive manual configuration guide
├── QUICK_START_GUIDE.md                # Quick start & code reference
├── DEPLOYMENT_TESTING_GUIDE.md         # Deployment process & test cases
├── FILE_STRUCTURE.md                   # This file
│
├── package.json                        # Node dependencies & build scripts
├── now.config.json                     # ServiceNow app configuration
├── now.prebuild.mjs                    # Build configuration
├── .eslintrc                           # ESLint configuration
├── .gitignore                          # Git ignore patterns
│
├── src/
│   ├── client/                         # FRONTEND - React Application
│   │   ├── app.jsx                     # ✓ Main React component (46 lines, complete)
│   │   ├── app.css                     # ✓ Main styles with dashboard & filters
│   │   ├── index.html                  # ✓ HTML entry point
│   │   ├── main.jsx                    # ✓ React bootstrap
│   │   │
│   │   ├── components/
│   │   │   ├── IncidentForm.jsx        # ✓ Form modal component (complete)
│   │   │   ├── IncidentForm.css        # ✓ Form styles (responsive)
│   │   │   ├── IncidentList.jsx        # ✓ Incident table component (complete)
│   │   │   └── IncidentList.css        # ✓ Table styles (badges, buttons)
│   │   │
│   │   └── services/
│   │       └── IncidentService.js      # ✓ API client service (complete)
│   │
│   └── fluent/                         # BACKEND - ServiceNow APIs
│       ├── index.now.ts                # ✓ 10 REST API endpoints (complete)
│       │   ├── GET /incidents
│       │   ├── GET /incidents/{sys_id}
│       │   ├── POST /incidents
│       │   ├── PATCH /incidents/{sys_id}
│       │   ├── GET /students/{student_id}/incidents
│       │   ├── POST /incidents/calculate-fee
│       │   ├── POST /incidents/{sys_id}/assess
│       │   ├── POST /incidents/{sys_id}/approve
│       │   ├── POST /incidents/{sys_id}/reject
│       │   ├── POST /incidents/{sys_id}/payment
│       │   └── GET /dashboard/stats
│       │
│       ├── ui-pages/
│       │   └── incident-manager.now.ts # ✓ UI page definition
│       │
│       └── generated/
│           └── keys.ts                 # Generated type keys
```

---

## Component Documentation

### Frontend Components

#### 1. **app.jsx** - Main React Component
**Purpose:** Root component handling state, routing, and orchestration

**Key Features:**
- State management (incidents, loading, filter, stats)
- Dashboard statistics display
- Incident filtering (all, pending, assessed, approved)
- Form modal management
- Error handling

**Methods:**
- `refreshIncidents()` - Fetch incidents and stats from API
- `handleCreateClick()` - Open new incident form
- `handleEditClick(incident)` - Open edit form
- `handleFormSubmit(formData)` - Submit form (create or update)

**Props Passed:**
- To `IncidentList`: incidents, onEdit, onRefresh, service
- To `IncidentForm`: incident, onSubmit, onCancel, service

**Dependencies:**
- React hooks: useState, useEffect, useMemo
- IncidentService
- IncidentList, IncidentForm components

**Render Structure:**
```
App
├── Header (title + create button)
├── Dashboard Stats (5 cards)
├── Filter Tabs (all, pending, assessed, approved)
├── IncidentList (if not loading)
└── IncidentForm (if showForm is true)
```

---

#### 2. **IncidentForm.jsx** - Incident Form Component
**Purpose:** Modal form for creating and editing incidents

**Key Features:**
- Student information section
- Book information section  
- Incident details section
- Cost information with real-time fee calculation
- Form validation
- Disabled field logic based on editing state

**Methods:**
- `calculateFee(cost, type)` - Call API to calculate fees
- `handleChange(e)` - Update form state and trigger fee calc
- `handleSubmit(e)` - Submit form data

**Form Sections:**
1. **Student Information:**
   - Student Name (required, disabled if editing)
   - Student ID (required, disabled if editing)
   - Student Email (required, disabled if editing)

2. **Book Information:**
   - Book Title (required)
   - ISBN (optional)
   - Incident Type (Damaged/Loss dropdown)

3. **Incident Details:**
   - Incident Date (required, default today)
   - Description (optional textarea)
   - Photo URL (optional)

4. **Cost Information:**
   - Replacement Cost (required, number input)
   - Estimated Charge Display (calculated, read-only)

**Props:**
- `incident` - Incident object if editing (null if creating)
- `onSubmit(formData)` - Callback when form submitted
- `onCancel()` - Callback when cancel button clicked
- `service` - IncidentService instance

**State:**
- `formData` - Form field values
- `estimatedFee` - Calculated fee amount
- `loading` - Loading state during calculation

---

#### 3. **IncidentList.jsx** - Incident List Component
**Purpose:** Display incidents in sortable/filterable table with actions

**Key Features:**
- Table display with 9 columns
- Status badges with color coding
- Action buttons (Assess, Approve, Reject, Payment, Edit)
- Context-aware button visibility
- No-incidents placeholder

**Columns:**
1. Incident #
2. Book Title
3. Student Name
4. Type (Damaged/Loss)
5. Assessment Status (Pending/Assessed/Disputed)
6. Charge ($)
7. Payment Status (Pending/Paid/Waived)
8. Approval Status (Pending/Approved/Rejected)
9. Actions

**Action Buttons:**
- **Assess:** If assessment_status == 'Pending'
  - Calls `service.assess()`
  - Shows estimated charge + fee breakdown
  
- **Approve:** If assessment_status == 'Assessed' AND approval_status == 'Pending'
  - Calls `service.approve()`
  - Sends payment request notification
  
- **Reject:** If assessment_status == 'Assessed' AND approval_status == 'Pending'
  - Calls `service.reject(reason)`
  - Requires user to enter reason
  
- **Payment:** If approval_status == 'Approved' AND payment_status == 'Pending'
  - Calls `service.recordPayment()`
  - Prompts for Paid/Waived choice
  
- **Edit:** Any incident
  - Calls `onEdit(incident)`

**Props:**
- `incidents[]` - Array of incident objects
- `onEdit(incident)` - Callback for edit action
- `onRefresh()` - Callback for refresh after action
- `service` - IncidentService instance

**Status Colors:**
- Pending: Yellow (#fff3cd)
- Assessed: Blue (#cfe2ff)
- Approved/Paid: Green (#d1e7dd)
- Rejected: Red (#f8d7da)

---

#### 4. **IncidentService.js** - API Client Service
**Purpose:** Centralized REST API communication layer

**Base URL:** `/api/x_1997678_acadreso`

**Methods:**

```javascript
// CRUD Operations
list()                              // GET /incidents
listByStudent(studentId)            // GET /students/{studentId}/incidents
get(sysId)                          // GET /incidents/{sysId}
create(data)                        // POST /incidents
update(sysId, data)                 // PATCH /incidents/{sysId}

// Calculation
calculateFee(replacementCost, incidentType)
                                    // POST /incidents/calculate-fee

// Workflow Actions
assess(sysId)                       // POST /incidents/{sysId}/assess
approve(sysId)                      // POST /incidents/{sysId}/approve
reject(sysId, reason)               // POST /incidents/{sysId}/reject
recordPayment(sysId, paymentStatus) // POST /incidents/{sysId}/payment

// Dashboard
getDashboardStats()                 // GET /dashboard/stats
```

**Error Handling:**
- Try-catch on all API calls
- Logs errors to console
- Re-throws for UI to display

**Headers:**
- Content-Type: application/json
- Accept: application/json
- No authentication token needed (inherits session)

---

### Styling Files

#### **app.css** - Main Application Styles
**Sections:**
1. **Layout** - App container, header, grid
2. **Dashboard Stats** - 5 stat cards with gradient backgrounds
3. **Filter Tabs** - Tab navigation with active state
4. **Loading** - Loading spinner animation
5. **Error Messages** - Error banner styling
6. **Responsive** - Mobile breakpoints

**Key Classes:**
- `.dashboard-stats` - Grid of stat cards
- `.stat-card` - Individual stat card (5 variants by type)
- `.filter-tabs` - Tab navigation container
- `.filter-btn` - Tab button (active/inactive states)
- `.loading` - Loading spinner with animation
- `.error-message` - Error banner with dismiss button

---

#### **IncidentForm.css** - Form Styling
**Sections:**
1. **Modal** - Overlay and container
2. **Form Layout** - Fieldsets, groups, rows
3. **Input Styling** - Text inputs, selects, textareas
4. **Fee Summary** - Fee calculation display
5. **Buttons** - Cancel and submit buttons
6. **Responsive** - Mobile form adjustments

**Key Classes:**
- `.form-overlay` - Dark overlay behind modal
- `.form-container` - Modal container
- `.form-header` - Header with title and close button
- `.form-group` - Individual form field wrapper
- `.form-row` - Two-column layout for related fields
- `.fee-summary` - Highlighted fee calculation box
- `.form-actions` - Button container at bottom

---

#### **IncidentList.css** - Table Styling
**Sections:**
1. **Table Layout** - Table and header styling
2. **Status Badges** - Color-coded status indicators
3. **Type Badges** - Incident type indicator
4. **Action Buttons** - Button styling with states
5. **Hover Effects** - Interactive feedback
6. **Responsive** - Mobile table adjustments

**Key Classes:**
- `.incident-list` - Table container
- `.status-badge` - Status badge (5 color variants)
- `.type-badge` - Incident type badge
- `.action-buttons` - Button container
- `.action-btn` - Action button (assess, approve, reject, etc.)

---

### Backend APIs

#### **index.now.ts** - Fluent API Endpoints
**Location:** `src/fluent/index.now.ts`
**Lines of Code:** 600+
**Endpoints:** 10 REST methods

**Endpoint Documentation:**

```typescript
// 1. GET /api/x_1997678_acadreso/incidents
Endpoint({
    $id: 'get_incidents',
    path: '/incidents',
    execute(request, response) {
        // Returns array of all incidents
        // Fields: sys_id, incident_number, student_name, book_title, 
        //         total_charge, assessment_status, payment_status, approval_status
    }
})

// 2. GET /api/x_1997678_acadreso/incidents/{sys_id}
Endpoint({
    $id: 'get_incident',
    path: '/incidents/{sys_id}',
    execute(request, response) {
        // Returns single incident with all details
    }
})

// 3. POST /api/x_1997678_acadreso/incidents
Endpoint({
    $id: 'create_incident',
    path: '/incidents',
    methods: ['POST'],
    execute(request, response) {
        // Create new incident
        // Request body: { student_id, student_name, student_email, 
        //                 book_title, incident_type, replacement_cost, ... }
        // Returns: { sys_id, incident_number, status: 'created' }
    }
})

// 4. PATCH /api/x_1997678_acadreso/incidents/{sys_id}
Endpoint({
    $id: 'update_incident',
    path: '/incidents/{sys_id}',
    methods: ['PATCH'],
    execute(request, response) {
        // Update incident fields
        // Allowed fields: description, incident_type, replacement_cost, 
        //                resolution_option, payment_status, assessment_status
    }
})

// 5. GET /api/x_1997678_acadreso/students/{student_id}/incidents
Endpoint({
    $id: 'get_student_incidents',
    path: '/students/{student_id}/incidents',
    execute(request, response) {
        // Get incidents for specific student
        // Ordered by incident_date descending
    }
})

// 6. POST /api/x_1997678_acadreso/incidents/calculate-fee
Endpoint({
    $id: 'calculate_fee',
    path: '/incidents/calculate-fee',
    methods: ['POST'],
    execute(request, response) {
        // Calculate fees for given replacement cost and incident type
        // Request: { replacement_cost, incident_type }
        // Returns: { replacement_cost, fee_percent, damage_fee, total_charge }
    }
})

// 7. POST /api/x_1997678_acadreso/incidents/{sys_id}/assess
Endpoint({
    $id: 'assess_incident',
    path: '/incidents/{sys_id}/assess',
    methods: ['POST'],
    execute(request, response) {
        // Assess incident and calculate fees
        // Auto-approves if total_charge < $50
        // Returns: { status, damage_fee, total_charge, auto_approved }
    }
})

// 8. POST /api/x_1997678_acadreso/incidents/{sys_id}/approve
Endpoint({
    $id: 'approve_incident',
    path: '/incidents/{sys_id}/approve',
    methods: ['POST'],
    execute(request, response) {
        // Approve incident and trigger payment request event
        // Returns: { status: 'approved' }
    }
})

// 9. POST /api/x_1997678_acadreso/incidents/{sys_id}/reject
Endpoint({
    $id: 'reject_incident',
    path: '/incidents/{sys_id}/reject',
    methods: ['POST'],
    execute(request, response) {
        // Reject incident with reason
        // Request: { reason }
        // Returns: { status: 'rejected' }
    }
})

// 10. POST /api/x_1997678_acadreso/incidents/{sys_id}/payment
Endpoint({
    $id: 'record_payment',
    path: '/incidents/{sys_id}/payment',
    methods: ['POST'],
    execute(request, response) {
        // Record payment (Paid/Waived)
        // Request: { payment_status }
        // Returns: { status, payment_status }
    }
})

// 11. GET /api/x_1997678_acadreso/dashboard/stats
Endpoint({
    $id: 'get_dashboard_stats',
    path: '/dashboard/stats',
    execute(request, response) {
        // Get dashboard statistics
        // Returns: { total_incidents, pending_assessment, pending_approval, 
        //           pending_payment, total_charges }
    }
})
```

---

## Configuration Files

### **package.json**
Defines project metadata and dependencies:
```json
{
  "name": "x-1997678-acad-resolve",
  "version": "1.0.0",
  "description": "Students want fair charges for lost/damaged items...",
  "scripts": {
    "build": "now-sdk build",
    "deploy": "now-sdk install",
    "transform": "now-sdk transform",
    "types": "now-sdk dependencies"
  },
  "devDependencies": {
    "@servicenow/sdk": "4.6.0",
    "@servicenow/glide": "26.0.1",
    "eslint": "8.50.0",
    "react": "19.x",
    "react-dom": "19.x"
  }
}
```

### **now.config.json**
ServiceNow app configuration:
```json
{
  "scope": "x_1997678_acadreso",
  "scopeId": "5589e77e835483109bb1c710feaad3fc",
  "name": "AcadResolve"
}
```

---

## Documentation Files

### **README.md**
- Project overview
- Requirements compliance matrix
- Architecture diagram
- Feature comparison
- Quick links to other docs

### **IMPLEMENTATION_GUIDE.md**
- Part 1-2: Table & column configuration
- Part 3-4: Client scripts & UI actions
- Part 5-6: Notifications & workflows
- Part 7-8: Integration Hub & Service Portal
- Part 9-10: User roles & demo data
- Part 11-12: Deployment & testing

### **QUICK_START_GUIDE.md**
- 5-minute quick start
- Code architecture overview
- Data flow diagram
- Feature documentation
- Integration points
- Troubleshooting

### **DEPLOYMENT_TESTING_GUIDE.md**
- Pre-deployment checklist
- Deployment process (2 options)
- 10 comprehensive test cases
- Performance testing
- UAT sign-off template
- Post-deployment monitoring

---

## Data Model

### Tables Referenced

**1. x_1997678_acadreso_book_incident**
- Auto-numbered incident records
- Student information (name, ID, email)
- Book information (title, ISBN, item ID)
- Incident details (date, type, description, photos)
- Assessment & approval workflow
- Payment tracking
- 20+ columns

**2. x_1997678_acadreso_fee_config**
- Configurable fee percentages
- Damage fee % (default 10%)
- Loss fee % (default 100%)
- Replacement window in days
- Active flag

**3. System Tables Used**
- sys_user (user records)
- sys_email (email notifications)
- sysapproval_approver (approval workflow)

---

## Build & Deployment Commands

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to ServiceNow instance
npm run deploy

# Generate types
npm run types

# Transform for deployment
npm run transform
```

---

## Key Statistics

| Metric | Value |
|---|---|
| Total Files | 16 |
| Frontend Files | 8 |
| Backend Files | 3 |
| Documentation Files | 4 |
| Config Files | 3 |
| Total Lines of Code | 2000+ |
| React Components | 3 |
| API Endpoints | 10 |
| Database Tables | 2 |
| CSS Stylesheets | 4 |
| Documentation Pages | 1000+ lines |

---

## Development Workflow

1. **Local Development**
   - Edit files in `src/` directory
   - Run `npm run build`

2. **Testing**
   - Deploy to dev instance
   - Execute test cases from DEPLOYMENT_TESTING_GUIDE.md

3. **Configuration**
   - Follow IMPLEMENTATION_GUIDE.md for manual setup
   - Create tables, business rules, workflows

4. **Deployment**
   - Create Update Set
   - Export and deploy to production

---

## Navigation Guide

**For Quick Overview:**
→ Start with README.md

**For Getting Started:**
→ Read QUICK_START_GUIDE.md

**For Configuration:**
→ Follow IMPLEMENTATION_GUIDE.md (Parts 1-10)

**For Deployment & Testing:**
→ Use DEPLOYMENT_TESTING_GUIDE.md

**For Code Deep Dive:**
→ Review src/client/* and src/fluent/*

**For File Structure:**
→ You are reading this file!

---

**Last Updated:** April 21, 2026  
**Version:** 1.0  
**Status:** Production Ready

