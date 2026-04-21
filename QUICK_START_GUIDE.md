# AcadResolve - Quick Start Guide & Code Reference

## Quick Start - Getting Started in 5 Minutes

### Prerequisites
- ServiceNow Zurich PDI instance
- ServiceNow Studio/App Engine Studio installed
- Build Agent installed
- Application already scoped: `x_1997678_acadreso`

### Step 1: Deploy Backend APIs (Fluent)

The backend is already configured in `src/fluent/index.now.ts`. To deploy:

1. Open your ServiceNow instance
2. Navigate to **Studio > AcadResolve App**
3. Click **Build** → The APIs will automatically deploy
4. Navigate to **Integration Hub > Inbound REST APIs**
5. Verify endpoint: `/api/x_1997678_acadreso/incidents`

### Step 2: Access the Application

Once deployed, you can access the application at:

```
https://<your-instance>.service-now.com/x_1997678_acadreso_incident_manager.do
```

### Step 3: Create Demo Data

Run this in **System Console > Scripts - Background**:

```javascript
// Create fee configuration
var feeConfig = new GlideRecord('x_1997678_acadreso_fee_config');
feeConfig.config_name = 'Default Fee Configuration';
feeConfig.damage_fee_percent = 10;
feeConfig.loss_fee_percent = 100;
feeConfig.replacement_window_days = 30;
feeConfig.active = true;
feeConfig.insert();

// Create sample incident
var incident = new GlideRecord('x_1997678_acadreso_book_incident');
incident.student_id = 'demo.student';
incident.student_name = 'Demo Student';
incident.student_email = 'demo.student@example.com';
incident.book_title = 'Introduction to Algorithms';
incident.incident_type = 'Damaged';
incident.incident_date = new GlideDateTime();
incident.description = 'Coffee spilled on first chapter';
incident.replacement_cost = 85.00;
incident.assessment_status = 'Pending';
incident.payment_status = 'Pending';
incident.insert();

gs.info('Demo data created!');
```

### Step 4: Test the Application

1. Navigate to the incident manager page
2. Click "+ Report Incident"
3. Fill in the form with:
   - Book Title: "Test Book"
   - Incident Type: "Damaged"
   - Replacement Cost: $50.00
4. Click "Submit Incident"
5. Verify the incident appears in the list

### Step 5: Test Assessment Workflow

1. Click "Assess" on the incident
2. Watch as fees are calculated automatically
3. Click "Approve" to approve the incident
4. Verify the total charge is displayed ($50 + $5 fee = $55)

---

## Code Architecture

### Frontend Structure

```
src/client/
├── app.jsx                          # Main React component
├── app.css                          # Main styles
├── index.html                       # Entry point
├── main.jsx                         # React entry point
├── components/
│   ├── IncidentForm.jsx            # Form for creating/editing incidents
│   ├── IncidentForm.css
│   ├── IncidentList.jsx            # Table displaying incidents
│   └── IncidentList.css
└── services/
    └── IncidentService.js          # API communication layer
```

### Backend Structure

```
src/fluent/
├── index.now.ts                    # Fluent API endpoints
├── ui-pages/
│   └── incident-manager.now.ts     # UI page definition
└── generated/
    └── keys.ts                     # Generated type keys
```

### Key Components Explained

#### 1. **IncidentService.js** - API Layer
Handles all communication with backend:

```javascript
// Example API calls:
await incidentService.list()           // Get all incidents
await incidentService.create(data)     // Create new incident
await incidentService.assess(sysId)    // Assess and calculate fees
await incidentService.approve(sysId)   // Approve incident
await incidentService.recordPayment(sysId, status)  // Record payment
```

#### 2. **App.jsx** - Main Component
State management and orchestration:

```javascript
- incidents: Array of incident records
- loading: Loading state during API calls
- showForm: Controls form modal visibility
- filter: Filters incidents by status
- stats: Dashboard statistics
```

#### 3. **IncidentForm.jsx** - Form Component
Comprehensive form with:

```javascript
- Student information section
- Book information section
- Incident details section
- Cost information with fee calculation
- Real-time fee preview
```

#### 4. **IncidentList.jsx** - List Component
Table display with actions:

```javascript
- Assess action (assess and calculate fees)
- Approve action (approve incident)
- Reject action (reject with reason)
- Payment action (record payment)
- Edit action (modify incident)
```

#### 5. **Fluent APIs** - Backend Endpoints

Available endpoints:

```
GET    /api/x_1997678_acadreso/incidents
GET    /api/x_1997678_acadreso/incidents/{sys_id}
POST   /api/x_1997678_acadreso/incidents
PATCH  /api/x_1997678_acadreso/incidents/{sys_id}
GET    /api/x_1997678_acadreso/students/{student_id}/incidents
POST   /api/x_1997678_acadreso/incidents/calculate-fee
POST   /api/x_1997678_acadreso/incidents/{sys_id}/assess
POST   /api/x_1997678_acadreso/incidents/{sys_id}/approve
POST   /api/x_1997678_acadreso/incidents/{sys_id}/reject
POST   /api/x_1997678_acadreso/incidents/{sys_id}/payment
GET    /api/x_1997678_acadreso/dashboard/stats
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  (App.jsx → IncidentList + IncidentForm)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    IncidentService.js                        │
│              (REST API Communication Layer)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               Fluent API Endpoints                          │
│      (index.now.ts - Business Logic Layer)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│             ServiceNow Database                             │
│   - x_1997678_acadreso_book_incident                        │
│   - x_1997678_acadreso_fee_config                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Incident Workflow

### State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PENDING ASSESSMENT                        │
│  (Initial state when incident is created)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                 Assess Button
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      ASSESSED                                │
│  (Fees calculated, auto-approved if < $50)                 │
└──────┬─────────────────────────────────┬────────────────────┘
       │                                 │
  Approve Button                   Reject Button
       │                                 │
       ↓                                 ↓
┌──────────────────┐         ┌──────────────────────┐
│    APPROVED      │         │    REJECTED          │
│ (awaiting payment)│        │ (closed out)          │
└──────┬───────────┘         └──────────────────────┘
       │
  Payment Button
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│              PAID / WAIVED                                   │
│           (Resolved - Closed)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features & Implementation

### Feature 1: Automatic Fee Calculation

When an incident is submitted:
1. Replacement cost is provided
2. Incident type determines fee percentage:
   - **Damaged**: 10% fee
   - **Lost**: 100% fee
3. Total charge = Replacement Cost + Fee
4. Shown in real-time in the form

**Code Location:** `IncidentService.calculateFee()` → Fluent API `/calculate-fee`

### Feature 2: Auto-Approval for Low-Value Items

If total charge < $50:
- Incident is automatically approved
- No manager review needed
- Payment request sent directly to student

**Code Location:** Fluent API `/incidents/{sys_id}/assess`

### Feature 3: Dashboard Statistics

Real-time metrics:
- Total incidents
- Pending assessment count
- Pending approval count
- Pending payment count
- Total charges

**Code Location:** `IncidentService.getDashboardStats()` → Fluent API `/dashboard/stats`

### Feature 4: Status Filtering

Filter incidents by:
- All incidents
- Pending assessment
- Assessed incidents
- Approved incidents

**Code Location:** `App.jsx` - `filteredIncidents` logic

### Feature 5: Incident Actions

Available actions based on status:

| Current Status | Available Actions |
|---|---|
| Pending Assessment | Assess |
| Assessed, Pending Approval | Approve, Reject |
| Approved, Pending Payment | Record Payment |
| Any Status | Edit |

**Code Location:** `IncidentList.jsx` - action rendering logic

---

## Integration Points (To Be Configured Manually)

### 1. Email Notifications
Send notifications when:
- Incident assessed → student notified
- Incident approved → payment request sent
- Payment recorded → confirmation sent

**Table:** Book Incident
**Events to trigger:** 
- `x_1997678_acadreso.incident.status_changed`
- `x_1997678_acadreso.incident.approved`
- `x_1997678_acadreso.payment_received`

### 2. AI Integration
Analyze incident descriptions using AI to:
- Assess fairness of charges
- Suggest adjustments
- Flag suspicious patterns

**Integration Type:** REST API to OpenAI/similar

### 3. Payment Gateway
Process payments via:
- Credit card processing
- Mobile payment
- Direct transfer

**Integration Type:** Outbound REST API

### 4. Document Storage
Store photos and evidence:
- Incident photos
- Assessment documents
- Payment receipts

**Integration Type:** Cloud storage (S3, Azure Blob)

---

## Troubleshooting

### Issue: "API endpoints not found"
**Solution:** Ensure Build Agent has run. Go to **Studio > Build** and wait for completion.

### Issue: "Incidents not loading"
**Solution:** Check browser console for CORS errors. Verify API base URL is correct in `IncidentService.js`

### Issue: "Fee calculation not working"
**Solution:** Ensure `x_1997678_acadreso_fee_config` table has at least one active record.

### Issue: "Form submit fails"
**Solution:** Verify all required fields are filled. Check console for specific error message.

### Issue: "Styles not applying"
**Solution:** Clear browser cache. Rebuild the application in Studio.

---

## Performance Optimization Tips

1. **Lazy Load Dashboard Stats:** Stats only load on initial page load
2. **Debounce Fee Calculation:** Calculation only runs when user stops typing
3. **Paginate Incident List:** Add pagination for 1000+ incidents
4. **Cache API Responses:** Store recent calls in local storage
5. **Virtual Scrolling:** For large tables, implement virtual scrolling

---

## Security Considerations

1. **ACL Configuration:** Restrict access by user role
2. **Input Validation:** All forms validated client-side and server-side
3. **CSRF Protection:** ServiceNow handles automatically
4. **Rate Limiting:** Add rate limiting to API endpoints
5. **Data Encryption:** Sensitive data encrypted in transit (HTTPS)

---

## Next Steps

1. **Manual Configuration** - Follow IMPLEMENTATION_GUIDE.md for:
   - Creating tables
   - Setting up business rules
   - Configuring notifications
   - Setting user permissions

2. **Integration Setup** - Configure:
   - Email notifications
   - AI integration
   - Payment gateway
   - Document storage

3. **Customization** - Modify as needed:
   - Fee structure
   - Approval thresholds
   - Notification templates
   - UI styling

4. **Testing** - Validate:
   - User roles and permissions
   - Email delivery
   - Fee calculations
   - Workflow transitions

5. **Deployment** - Move to production:
   - Export as Update Set
   - Test in staging
   - Deploy to production
   - Monitor for issues

---

## Support Resources

- **ServiceNow Documentation:** https://docs.servicenow.com
- **SDK Documentation:** https://developer.servicenow.com
- **Community Forum:** https://community.servicenow.com
- **Training:** https://www.servicenow.com/training

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-21  
**For:** ServiceNow Zurich PDI Instance

