# AcadResolve - Deployment & Testing Guide

## Pre-Deployment Checklist

Before deploying to production, ensure all components are in place:

### Code Components
- [ ] Backend Fluent APIs configured (`src/fluent/index.now.ts`)
- [ ] Frontend React app complete (`src/client/app.jsx`)
- [ ] All components created (`IncidentForm.jsx`, `IncidentList.jsx`)
- [ ] Styling complete (all .css files)
- [ ] IncidentService configured

### Database Components (Manual - See IMPLEMENTATION_GUIDE.md)
- [ ] `x_1997678_acadreso_book_incident` table created
- [ ] `x_1997678_acadreso_fee_config` table created
- [ ] All required fields added to both tables
- [ ] Auto-number sequence configured for incidents

### Business Logic (Manual - See IMPLEMENTATION_GUIDE.md)
- [ ] Business rules created (fees, approvals, notifications)
- [ ] Client scripts added (form load, change handlers)
- [ ] UI actions configured (assess, approve, reject, payment)

### Integration & Workflow (Manual - See IMPLEMENTATION_GUIDE.md)
- [ ] Email notifications configured
- [ ] Flow Designer workflows created
- [ ] REST API integrations set up
- [ ] AI integration configured (optional)
- [ ] Payment gateway configured (optional)

### Security & Access (Manual - See IMPLEMENTATION_GUIDE.md)
- [ ] User roles created (student, staff, manager)
- [ ] ACL rules configured
- [ ] Demo users set up for testing

---

## Deployment Process

### Phase 1: Build & Package

```bash
# From project root directory
npm install
npm run build
```

### Phase 2: Deploy to Instance

#### Option A: Using Update Set (Recommended)

1. **Create Update Set**
   - Navigate to **System Update > Update Sets > New**
   - Name: `AcadResolve_v1.0_Production`
   - Description: `Production deployment of AcadResolve application`

2. **Add Components to Update Set**
   - Go to **Studio > AcadResolve App**
   - Right-click → **Export to Update Set**
   - Select the update set created above

3. **Export Update Set**
   - Navigate to **System Update > Update Sets**
   - Right-click on your update set → **Export**
   - Save the XML file

4. **Import in Target Instance**
   - In target instance: **System Update > Update Sets**
   - Click **Import Update Set** → Upload the XML file
   - Click **Preview Update Set** to review changes
   - Click **Commit Update Set** to apply

#### Option B: Using Studio Direct Deploy

1. **Activate in Studio**
   - Go to **Studio > AcadResolve > Activate**
   - Version: `1.0`

2. **Build**
   - Click **Build** and wait for completion

3. **Deploy**
   - Click **Deploy** (if available)
   - Or go to **System Applications > Install from Repo**

### Phase 3: Verify Deployment

```javascript
// Run in System Console > Scripts - Background

// 1. Verify tables exist
var tables = ['x_1997678_acadreso_book_incident', 'x_1997678_acadreso_fee_config'];
tables.forEach(function(tableName) {
    var gr = new GlideRecord(tableName);
    if (gr.isValid()) {
        gs.info('✓ Table exists: ' + tableName);
    } else {
        gs.error('✗ Table missing: ' + tableName);
    }
});

// 2. Verify API endpoints
var endpoint = 'http://' + gs.getProperty('instance_name') + 
    '.service-now.com/api/x_1997678_acadreso/dashboard/stats';
gs.info('API Endpoint: ' + endpoint);

// 3. Check fee configuration
var feeConfig = new GlideRecord('x_1997678_acadreso_fee_config');
feeConfig.addQuery('active', true);
if (feeConfig.query()) {
    gs.info('✓ Fee configuration found');
} else {
    gs.warn('⚠ No active fee configuration - please create one');
}
```

---

## Testing Strategy

### Test Environment Setup

1. **Create Test Users**
   - Student: test.student@example.com (Role: acad_resolve_student)
   - Staff: test.staff@example.com (Role: acad_resolve_library_staff)
   - Manager: test.manager@example.com (Role: acad_resolve_manager)
   - Admin: Your admin account

2. **Load Test Data**
   - Run demo data script from QUICK_START_GUIDE.md

### Test Cases

#### TC1: Create Book Incident
**Objective:** Verify students can report incidents

**Steps:**
1. Log in as test.student
2. Navigate to AcadResolve portal
3. Click "+ Report Incident"
4. Fill form:
   - Book Title: "Database Management Systems"
   - Incident Type: "Damaged"
   - Replacement Cost: $120.00
5. Click "Submit Incident"

**Expected Result:**
- Incident created with status "Pending Assessment"
- Incident number auto-generated (e.g., BI-0000001)
- Estimated charge shows $132.00 (120 + 12)
- Email confirmation sent to student

**Pass/Fail:** ____

#### TC2: Assess Incident & Calculate Fees
**Objective:** Verify staff can assess incidents and fees are calculated

**Steps:**
1. Log in as test.staff
2. Navigate to Incidents list
3. Find incident from TC1
4. Click "Assess" button
5. Observe fee calculation

**Expected Result:**
- Assessment status changes to "Assessed"
- Damage fee calculated: 10% of $120 = $12
- Total charge: $132
- Incident available for approval (if $132 > $50, requires manager approval)

**Pass/Fail:** ____

#### TC3: Approve Incident
**Objective:** Verify manager can approve incidents

**Steps:**
1. Log in as test.manager
2. Navigate to Incidents list
3. Find assessed incident from TC2
4. Verify assessment details
5. Click "Approve" button

**Expected Result:**
- Approval status changes to "Approved"
- Payment request email sent to student
- Incident moves to payment pending status

**Pass/Fail:** ____

#### TC4: Auto-Approve Low-Value Incident
**Objective:** Verify low-value incidents auto-approve

**Steps:**
1. Create new incident (as student)
   - Replacement Cost: $30.00
2. Log in as test.staff
3. Click "Assess"

**Expected Result:**
- Status automatically changes to "Approved" (no manual approval needed)
- Total charge: $33 (30 + 10% fee)
- Payment request sent to student immediately

**Pass/Fail:** ____

#### TC5: Reject Incident
**Objective:** Verify incidents can be rejected

**Steps:**
1. Create and assess an incident (as TC2)
2. Log in as test.manager
3. Click "Reject" button
4. Enter reason: "Damage is pre-existing"

**Expected Result:**
- Approval status: "Rejected"
- Reason added to notes
- Student notified of rejection

**Pass/Fail:** ____

#### TC6: Record Payment
**Objective:** Verify payment can be recorded

**Steps:**
1. Complete approval workflow (TC1-3)
2. Log in as test.staff
3. Find approved incident
4. Click "Payment" button
5. Choose "Paid"

**Expected Result:**
- Payment status: "Paid"
- Incident marked as resolved
- Confirmation email sent to student

**Pass/Fail:** ____

#### TC7: Dashboard Statistics
**Objective:** Verify dashboard displays correct statistics

**Steps:**
1. After completing all incident tests above
2. Open application homepage
3. View dashboard stats

**Expected Result:**
Dashboard shows:
- Total Incidents: 5+ (from all test cases)
- Pending Assessment: 0-1
- Pending Approval: 0-1
- Pending Payment: 0-1
- Total Charges: $450+ (sum of all incidents)

**Pass/Fail:** ____

#### TC8: Filter Incidents
**Objective:** Verify incident filtering works

**Steps:**
1. Click "Pending Assessment" filter
2. Observe list
3. Click "Assessed" filter
4. Observe list
5. Click "All Incidents" filter

**Expected Result:**
- Each filter shows correct incidents
- Counts match dashboard

**Pass/Fail:** ____

#### TC9: Edit Incident
**Objective:** Verify incidents can be edited

**Steps:**
1. Find any incident
2. Click "Edit" button
3. Change description
4. Click "Update"

**Expected Result:**
- Incident updated
- Changes reflected in list
- Audit trail created

**Pass/Fail:** ____

#### TC10: Fee Calculation Accuracy
**Objective:** Verify fee calculations are correct

**Test Cases:**
- Damaged book, $50: Fee = $5, Total = $55
- Damaged book, $100: Fee = $10, Total = $110
- Lost book, $50: Fee = $50, Total = $100
- Lost book, $200: Fee = $200, Total = $400

**Expected Result:**
- All calculations match expected values
- Formulas applied correctly

**Pass/Fail:** ____

---

## Performance Testing

### Load Testing Script

```javascript
// Test API performance under load
// Run in System Console

var results = [];

for (var i = 0; i < 10; i++) {
    var startTime = new GlideDateTime();
    
    // Create incident
    var incident = new GlideRecord('x_1997678_acadreso_book_incident');
    incident.student_id = 'perf.test.' + i;
    incident.student_name = 'Perf Test ' + i;
    incident.student_email = 'perf.test' + i + '@example.com';
    incident.book_title = 'Performance Test Book ' + i;
    incident.incident_type = 'Damaged';
    incident.incident_date = new GlideDateTime();
    incident.replacement_cost = 50 + i;
    incident.assessment_status = 'Pending';
    incident.payment_status = 'Pending';
    incident.insert();
    
    var endTime = new GlideDateTime();
    var duration = endTime.getNumericValue() - startTime.getNumericValue();
    
    results.push({
        iteration: i,
        duration: duration + 'ms'
    });
}

gs.info('Performance Results: ' + JSON.stringify(results));
```

### Target Metrics
- Create incident: < 500ms
- List incidents: < 1000ms
- Assess incident: < 200ms
- Approve incident: < 200ms
- Dashboard stats: < 500ms

---

## UAT Sign-Off

### UAT Participants
- [ ] System Administrator: ____________________
- [ ] Student Affairs Manager: ____________________
- [ ] Library Director: ____________________
- [ ] IT Support Lead: ____________________

### UAT Approval Criteria

| Criteria | Met? | Comments |
|---|---|---|
| All test cases pass | [ ] | |
| Performance acceptable | [ ] | |
| Security verified | [ ] | |
| User training completed | [ ] | |
| Documentation complete | [ ] | |
| Backup/Recovery tested | [ ] | |
| Support plan in place | [ ] | |

### Sign-Off

**Date:** ____________________

**Approved by:** ____________________

**Notes:** 
_________________________________________________________________
_________________________________________________________________

---

## Post-Deployment

### Day 1 Monitoring

```javascript
// Run every 4 hours on Day 1
// Check for errors and issues

var incidents = new GlideRecord('x_1997678_acadreso_book_incident');
incidents.query();

var stats = {
    total: incidents.getRowCount(),
    pending: new GlideRecord('x_1997678_acadreso_book_incident')
        .addQuery('assessment_status', 'Pending').getRowCount(),
    approved: new GlideRecord('x_1997678_acadreso_book_incident')
        .addQuery('approval_status', 'Approved').getRowCount(),
    paid: new GlideRecord('x_1997678_acadreso_book_incident')
        .addQuery('payment_status', 'Paid').getRowCount()
};

gs.info('Day 1 Stats: ' + JSON.stringify(stats));
```

### Issue Response Procedure

**Priority 1 (Critical - Stop/Restore):**
- Application completely down
- Data loss occurring
- Security breach
- **Response:** Immediate rollback to previous version

**Priority 2 (High - Urgent Fix):**
- Core functionality broken
- Significant data errors
- User unable to complete tasks
- **Response:** Hotfix within 2 hours

**Priority 3 (Medium - Scheduled Fix):**
- Non-critical feature broken
- Performance degradation
- Minor data issues
- **Response:** Include in next release

**Priority 4 (Low - Document):**
- UI cosmetic issues
- Minor performance concerns
- Feature requests
- **Response:** Track for future release

---

## Rollback Plan

If deployment needs to be rolled back:

### Rollback Steps

1. **Notify Stakeholders**
   - Inform users of issue and rollback
   - Estimate recovery time

2. **Restore Previous Version**
   - Use update set rollback feature
   - Or restore from backup

3. **Verify Rollback**
   - Test key functionality
   - Verify data integrity
   - Check user access

4. **Post-Incident Review**
   - Document what went wrong
   - Update deployment process
   - Schedule hotfix

### Rollback Checklist
- [ ] Stakeholders notified
- [ ] Previous version activated
- [ ] Core functions tested
- [ ] Users regain access
- [ ] Data verified
- [ ] Incident documented

---

## Maintenance Schedule

### Weekly
- Check incident volume trends
- Verify all notifications sending
- Review error logs

### Monthly
- Backup database
- Update fee configurations
- Review user activity logs
- Performance analysis

### Quarterly
- Security audit
- Performance optimization
- User feedback review
- Planning for next release

---

## Support Contact Information

**Development Team:** dev-team@example.com  
**Operations Team:** ops-team@example.com  
**ServiceNow Administrator:** sn-admin@example.com  
**Help Desk:** helpdesk@example.com

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-21  
**Deployment Lead:** ____________________

