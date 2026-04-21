# AcadResolve Application - Implementation Guide

## Project Overview
**Sector:** Education
**Problem:** Lost/Damaged Book Dispute & Settlement
**Solution:** Fair charges for lost/damaged items with integrated intake, photo capture, fee calculation, and settlement

---

## Architecture Overview

### Scope Information
- **Scope Name:** AcadResolve
- **Scope ID:** x_1997678_acadreso
- **Instance Type:** PDI Zurich (Build Agent, ServiceNow Studio, App Engine Studio)

### Application Components

```
AcadResolve App
├── Scoped Application (x_1997678_acadreso)
├── Backend (Fluent APIs)
├── Frontend (React - Service Portal)
├── Database (Custom Tables)
├── Business Logic (Business Rules, Client Scripts, Flows)
├── Notifications (Email, Approvals)
├── Integration Hub (REST, AI)
└── Workflows (Flow Designer)
```

---

## PART 1: TABLE CONFIGURATION

### Step 1.1: Create "Book Incident" Table
**Menu Path:** System Definition > Tables and Columns

1. Navigate to **System Definition > Tables**
2. Click **New**
3. Configure:
   - **Label:** Book Incident
   - **Name:** x_1997678_acadreso_book_incident
   - **Create Module:** Yes (under AcadResolve)
   - **Create Menu Folder:** Yes
   - **Auto Number:** Yes (Prefix: BI-, Format: 0000000)

### Step 1.2: Add Columns to Book Incident Table

| Field Name | Type | Properties | Required | Notes |
|---|---|---|---|---|
| incident_number | Auto Number | Read-only | Yes | System generated |
| student_id | String | 100 chars | Yes | Student ID from user record |
| student_name | String | 100 chars | Yes | Student full name |
| student_email | String | 100 chars | Yes | Student email for notifications |
| book_title | String | 200 chars | Yes | Title of damaged/lost book |
| book_isbn | String | 20 chars | No | ISBN of book |
| item_id | String | 50 chars | No | Library item ID |
| incident_type | Choice | Lost, Damaged | Yes | Defaults to "Damaged" |
| incident_date | Date/Time | | Yes | When incident occurred |
| description | Text | Large text | No | Incident description |
| photo_url | String | URL | No | URL to photo evidence |
| assessment_status | Choice | Pending, Assessed, Disputed | Yes | Default: "Pending" |
| assessed_by | Reference | sys_user | No | Staff who assessed |
| replacement_cost | Decimal | 2 decimals | No | Book replacement cost |
| damage_fee | Decimal | 2 decimals | No | Calculated damage fee |
| total_charge | Decimal | 2 decimals | No | Total charge (read-only) |
| resolution_option | Choice | Replace, Pay, Waive | No | Student resolution choice |
| payment_status | Choice | Pending, Paid, Waived | Yes | Default: "Pending" |
| approval_status | Choice | Pending, Approved, Rejected | Yes | Default: "Pending" |
| approved_by | Reference | sys_user | No | Manager who approved |
| resolved_date | Date/Time | | No | When resolved |
| notes | Text | Large text | No | Internal notes |

### Step 1.3: Create "Fee Configuration" Table
**Menu Path:** System Definition > Tables

1. Create table: **x_1997678_acadreso_fee_config**
2. Add columns:

| Field Name | Type | Properties | Required |
|---|---|---|---|
| config_name | String | 100 chars | Yes |
| damage_fee_percent | Decimal | 2 decimals, Default: 10 | Yes |
| loss_fee_percent | Decimal | 2 decimals, Default: 100 | Yes |
| replacement_window_days | Integer | Default: 30 | Yes |
| active | Boolean | Default: True | Yes |

---

## PART 2: BUSINESS RULES CONFIGURATION

### Step 2.1: Calculate Total Charge Business Rule
**Menu Path:** Business Rules

1. Go to **Business Rules**
2. Create new rule:
   - **Name:** Calculate Total Charge
   - **Table:** Book Incident
   - **When:** Before insert; Before update
   - **When to run:** Change
   - **Filter conditions:** When damage_fee or replacement_cost changes
   - **Advanced:** Yes

3. **Script:**

```javascript
(function executeRule(current, previous) {
    // Calculate damage fee based on replacement cost
    var feeConfig = new GlideRecord('x_1997678_acadreso_fee_config');
    feeConfig.addQuery('active', true);
    feeConfig.setLimit(1);
    feeConfig.query();
    
    if (feeConfig.next()) {
        var feePercent = current.incident_type == 'Loss' 
            ? feeConfig.loss_fee_percent 
            : feeConfig.damage_fee_percent;
        
        current.damage_fee = current.replacement_cost * (feePercent / 100);
    }
    
    // Calculate total charge
    current.total_charge = current.replacement_cost + current.damage_fee;
    
})(current, previous);
```

### Step 2.2: Auto-Approval for Low-Value Items
**Menu Path:** Business Rules

1. Create new rule:
   - **Name:** Auto-Approve Low Value Items
   - **Table:** Book Incident
   - **When:** Before update
   - **Condition:** total_charge < 50
   - **Advanced:** Yes

2. **Script:**

```javascript
(function executeRule(current, previous) {
    if (current.total_charge < 50) {
        current.approval_status = 'Approved';
        current.assessed_by = gs.getUserID();
        current.assessment_status = 'Assessed';
    }
})(current, previous);
```

### Step 2.3: Notify Student on Status Change
**Menu Path:** Business Rules

1. Create new rule:
   - **Name:** Notify Student on Status Update
   - **Table:** Book Incident
   - **When:** After insert; After update
   - **Condition:** assessment_status changes OR payment_status changes
   - **Advanced:** Yes

2. **Script:**

```javascript
(function executeRule(current, previous) {
    // Trigger event to send notification
    gs.eventQueue('x_1997678_acadreso.incident.status_changed', current);
})(current, previous);
```

---

## PART 3: CLIENT SCRIPTS CONFIGURATION

### Step 3.1: Form Load Script
**Menu Path:** Form > Scripts > Client Scripts

1. Go to **Client Scripts**
2. Create new script:
   - **Name:** Book Incident Form Load
   - **Table:** Book Incident
   - **Type:** onLoad
   - **UI Type:** Desktop

3. **Script:**

```javascript
function onLoad() {
    // Hide payment fields if not pending assessment
    var assessmentStatus = g_form.getValue('assessment_status');
    if (assessmentStatus != 'Pending') {
        g_form.setReadOnly('replacement_cost', true);
        g_form.setReadOnly('damage_fee', true);
    }
    
    // Set default incident date to today
    if (!g_form.getValue('incident_date')) {
        g_form.setValue('incident_date', new GlideDateTime().getDisplayValue());
    }
    
    // Disable student fields if not new record
    if (!g_isNewRecord) {
        g_form.setReadOnly('student_id', true);
        g_form.setReadOnly('student_name', true);
    }
}
```

### Step 3.2: Change Handler Script
**Menu Path:** Form > Scripts > Client Scripts

1. Create new script:
   - **Name:** Book Incident Incident Type Change
   - **Table:** Book Incident
   - **Type:** onChange
   - **Field Name:** incident_type
   - **UI Type:** Desktop

2. **Script:**

```javascript
function onChange(control, oldValue, newValue, isLoading, isTemplate) {
    if (isLoading || newValue == '') return;
    
    // Update damage fee label based on type
    var label = newValue == 'Loss' ? 'Loss Fee (100% of replacement cost)' : 'Damage Fee (10% of replacement cost)';
    g_form.setLabel('damage_fee', label);
    
    // Recalculate total
    var replacementCost = parseFloat(g_form.getValue('replacement_cost')) || 0;
    var feePercent = newValue == 'Loss' ? 100 : 10;
    var damageFee = replacementCost * (feePercent / 100);
    g_form.setValue('total_charge', replacementCost + damageFee);
}
```

---

## PART 4: UI ACTIONS CONFIGURATION

### Step 4.1: Assess Incident UI Action
**Menu Path:** Incident > UI Actions

1. Go to **UI Actions** (filter by table: Book Incident)
2. Create new UI Action:
   - **Name:** Assess
   - **Show in list:** Yes
   - **Show in form:** Yes
   - **Condition:** assessment_status != 'Assessed'
   - **Position:** Form top

3. **Script:**

```javascript
var current = g_form.getRecord();
current.assessment_status = 'Assessed';
current.assessed_by = gs.getUserID();
current.update();
g_form.refresh();
alert('Incident assessed. Please wait for auto-calculation of fees.');
```

### Step 4.2: Approve Incident UI Action
**Menu Path:** UI Actions

1. Create new UI Action:
   - **Name:** Approve
   - **Show in form:** Yes
   - **Condition:** assessment_status == 'Assessed' AND approval_status == 'Pending'
   - **Position:** Form top

2. **Script:**

```javascript
var current = g_form.getRecord();
current.approval_status = 'Approved';
current.approved_by = gs.getUserID();
current.update();
g_form.refresh();
gs.eventQueue('x_1997678_acadreso.incident.approved', current);
alert('Incident approved. Notification sent to student.');
```

### Step 4.3: Request Payment UI Action
**Menu Path:** UI Actions

1. Create new UI Action:
   - **Name:** Request Payment
   - **Show in form:** Yes
   - **Condition:** approval_status == 'Approved' AND payment_status == 'Pending'

2. **Script:**

```javascript
var current = g_form.getRecord();
gs.eventQueue('x_1997678_acadreso.payment_request', current);
alert('Payment request sent to student.');
```

---

## PART 5: NOTIFICATION CONFIGURATION

### Step 5.1: Create Email Notification - Incident Assessment
**Menu Path:** System Notification > Email > Notifications

1. Create notification:
   - **Name:** AcadResolve - Incident Assessed
   - **Table:** Book Incident
   - **When:** Event

2. **Event:** x_1997678_acadreso.incident.status_changed
3. **Recipients:**
   - **To:** ${student_email}

4. **Subject:**
```
Incident Status Update: ${incident_number} - ${book_title}
```

5. **Message:**
```html
<html>
<body>
<p>Dear ${student_name},</p>

<p>Your book incident has been updated:</p>

<table border="1">
<tr><td>Incident Number:</td><td>${incident_number}</td></tr>
<tr><td>Book Title:</td><td>${book_title}</td></tr>
<tr><td>Incident Type:</td><td>${incident_type}</td></tr>
<tr><td>Replacement Cost:</td><td>$${replacement_cost}</td></tr>
<tr><td>Assessment Status:</td><td>${assessment_status}</td></tr>
</table>

<p>Total Charge: <strong>$${total_charge}</strong></p>

<p>
    <a href="https://<instance>/x_1997678_acadreso_book_incident.do?sys_id=${sys_id}">
        View Incident Details
    </a>
</p>

<p>Thank you,<br/>AcadResolve Team</p>
</body>
</html>
```

### Step 5.2: Create Email Notification - Payment Request
**Menu Path:** System Notification > Email > Notifications

1. Create notification:
   - **Name:** AcadResolve - Payment Request
   - **Table:** Book Incident
   - **When:** Event
   - **Event:** x_1997678_acadreso.payment_request

2. **Recipients:**
   - **To:** ${student_email}

3. **Subject:**
```
Payment Request: ${incident_number}
```

4. **Message:**
```html
<html>
<body>
<p>Dear ${student_name},</p>

<p>A payment has been requested for your incident:</p>

<p>Amount Due: <strong>$${total_charge}</strong></p>
<p>Reason: ${incident_type} of ${book_title}</p>

<p>Options:</p>
<ul>
<li>Replace the item</li>
<li>Pay the charge</li>
<li>Submit a dispute</li>
</ul>

<p>
    <a href="https://<instance>/x_1997678_acadreso_book_incident.do?sys_id=${sys_id}">
        Respond to Payment Request
    </a>
</p>

<p>Please respond within 7 days.</p>

<p>Thank you,<br/>AcadResolve Team</p>
</body>
</html>
```

### Step 5.3: Create Inbound Email - Process Payment Responses
**Menu Path:** System Notification > Email > Inbound Email > Inbound Email Actions**

1. Create inbound email action:
   - **Name:** AcadResolve - Process Payment Response
   - **Email Sender Filter:** {pattern matching student emails}
   - **Subject:** Payment (e.g., contains "payment" or "paid")

2. **Script:**

```javascript
// This would process responses via Flow Designer
gs.eventQueue('x_1997678_acadreso.payment_response_received', current);
```

---

## PART 6: FLOW DESIGNER WORKFLOWS

### Step 6.1: Create "Incident Assessment Flow"
**Menu Path:** Flow Designer > Create New**

1. **Flow Name:** Incident Assessment Workflow
2. **Trigger:** Table Record - Book Incident
3. **Actions:**
   - **Action 1:** If assessment_status == "Assessed"
     - Create Approval Task
     - Assign to: Library Manager Role
     - Due date: +2 days
   
   - **Action 2:** If approval_status == "Approved"
     - Send Email notification (Payment Request)
     - Add Outbound Email record
   
   - **Action 3:** If payment_status == "Paid"
     - Create a service now ticket for replacement
     - Send confirmation email

### Step 6.2: Create "Payment Approval Flow"
**Menu Path:** Flow Designer > Create New**

1. **Flow Name:** Payment Approval Workflow
2. **Trigger:** Manual trigger OR Table Record change
3. **Actions:**
   - **Action 1:** Wait for event: payment_response
   - **Action 2:** If amount >= $100, route to manager approval
   - **Action 3:** If amount < $100, auto-approve
   - **Action 4:** Update payment_status
   - **Action 5:** Send confirmation email

---

## PART 7: INTEGRATION HUB & REST CONFIGURATION

### Step 7.1: Create REST Inbound Integration
**Menu Path:** System Web Services > REST > Inbound API**

1. Create new REST API:
   - **Name:** Book Incident API
   - **Namespace:** /x_1997678_acadreso
   - **Version:** /api/v1

2. Add Resources:

#### Resource 1: GET /incidents
- **Relative URI:** /incidents
- **HTTP Method:** GET
- **Script:**

```javascript
(function process(request, response) {
    var incidents = [];
    var gr = new GlideRecord('x_1997678_acadreso_book_incident');
    gr.query();
    
    while (gr.next()) {
        incidents.push({
            sys_id: gr.sys_id.toString(),
            incident_number: gr.incident_number.toString(),
            student_name: gr.student_name.toString(),
            book_title: gr.book_title.toString(),
            total_charge: gr.total_charge.toString(),
            assessment_status: gr.assessment_status.toString()
        });
    }
    
    response.setStatus(200);
    return incidents;
})(request, response);
```

#### Resource 2: POST /incidents
- **Relative URI:** /incidents
- **HTTP Method:** POST
- **Script:**

```javascript
(function process(request, response) {
    var body = request.body;
    var jsonBody = JSON.parse(body.getReader().readLine());
    
    var gr = new GlideRecord('x_1997678_acadreso_book_incident');
    gr.student_id = jsonBody.student_id;
    gr.student_name = jsonBody.student_name;
    gr.student_email = jsonBody.student_email;
    gr.book_title = jsonBody.book_title;
    gr.book_isbn = jsonBody.book_isbn;
    gr.incident_type = jsonBody.incident_type;
    gr.incident_date = jsonBody.incident_date;
    gr.description = jsonBody.description;
    gr.replacement_cost = jsonBody.replacement_cost;
    
    var sysId = gr.insert();
    
    response.setStatus(201);
    return {
        sys_id: sysId,
        status: 'created'
    };
})(request, response);
```

#### Resource 3: PATCH /incidents/{sys_id}
- **Relative URI:** /incidents/{sys_id}
- **HTTP Method:** PATCH
- **Script:**

```javascript
(function process(request, response) {
    var sysId = request.pathParams.sys_id;
    var body = request.body;
    var jsonBody = JSON.parse(body.getReader().readLine());
    
    var gr = new GlideRecord('x_1997678_acadreso_book_incident');
    if (gr.get(sysId)) {
        for (var key in jsonBody) {
            if (gr.isValidField(key)) {
                gr[key] = jsonBody[key];
            }
        }
        gr.update();
        
        response.setStatus(200);
        return { status: 'updated' };
    }
    
    response.setStatus(404);
    return { error: 'Not found' };
})(request, response);
```

### Step 7.2: Create Integration - AI Analysis
**Menu Path:** Integration Hub > Integrations**

1. Create new integration:
   - **Name:** AI Content Analysis
   - **Type:** Outbound REST
   - **Provider:** OpenAI API (or similar)

2. **Configuration:**

```
Endpoint: https://api.openai.com/v1/chat/completions
Method: POST
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
```

3. **Request Mapping:**

```javascript
{
  "model": "gpt-4",
  "messages": [{
    "role": "user",
    "content": "Analyze this incident: ${description}. Is the charge fair? Provide assessment in JSON format with fields: fair_assessment (boolean), reason (string), suggested_discount_percent (number)"
  }],
  "temperature": 0.7
}
```

4. **Response Mapping:**

```javascript
// Store AI analysis in the incident record
var gr = new GlideRecord('x_1997678_acadreso_book_incident');
gr.get(current.sys_id);
gr.ai_assessment = response.content;
gr.update();
```

### Step 7.3: Create Outbound Integration - Payment Gateway
**Menu Path:** Integration Hub > Outbound Integrations**

1. Integration name: **Process Payment**
2. Type: REST/SOAP
3. Endpoint: Your Payment Gateway API
4. Method: POST
5. Request body:

```json
{
  "transaction_id": "${incident_number}",
  "amount": ${total_charge},
  "student_id": "${student_id}",
  "student_email": "${student_email}",
  "description": "${book_title} - ${incident_type}",
  "callback_url": "https://<instance>/api/payments/callback"
}
```

---

## PART 8: SERVICE PORTAL CONFIGURATION

### Step 8.1: Create Service Portal Widget
**Menu Path:** Service Portal > Portals > AcadResolve Portal**

1. **Portal Name:** AcadResolve Portal
   - **Create Portal:** Yes
   - **Copy from:** Default Portal
   - **Default page:** Home

### Step 8.2: Create Widget - Incident Self-Service
**Menu Path:** Service Portal > Widgets**

1. **Name:** AcadResolve Incident Portal
2. **Code:**

```html
<!-- HTML Template -->
<div ng-controller="incidentPortalCtrl" ng-cloak>
    <h2>Book Incident Management</h2>
    
    <!-- Create New Incident -->
    <div class="form-section">
        <h3>Report New Incident</h3>
        <form>
            <div class="form-group">
                <label>Book Title:</label>
                <input type="text" ng-model="newIncident.book_title" required>
            </div>
            <div class="form-group">
                <label>Incident Type:</label>
                <select ng-model="newIncident.incident_type">
                    <option value="Damaged">Damaged</option>
                    <option value="Loss">Lost</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea ng-model="newIncident.description" rows="4"></textarea>
            </div>
            <button ng-click="createIncident()" class="btn btn-primary">Submit Incident</button>
        </form>
    </div>
    
    <!-- View My Incidents -->
    <div class="incidents-section">
        <h3>My Incidents</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Number</th>
                    <th>Book</th>
                    <th>Status</th>
                    <th>Charge</th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="incident in myIncidents">
                    <td>{{incident.incident_number}}</td>
                    <td>{{incident.book_title}}</td>
                    <td>
                        <span class="label" ng-class="incident.assessment_status">
                            {{incident.assessment_status}}
                        </span>
                    </td>
                    <td>${{incident.total_charge}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
    .form-section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
    .form-group { margin: 10px 0; }
    .incidents-section { margin-top: 30px; }
</style>
```

3. **JavaScript Controller:**

```javascript
app.controller('incidentPortalCtrl', ['$scope', '$http', function($scope, $http) {
    
    $scope.myIncidents = [];
    $scope.newIncident = {
        incident_type: 'Damaged'
    };
    
    // Load user's incidents
    $scope.loadIncidents = function() {
        $http.get('/api/x_1997678_acadreso/incidents?student_id=' + gs.getUserID())
            .then(function(response) {
                $scope.myIncidents = response.data;
            });
    };
    
    // Create new incident
    $scope.createIncident = function() {
        var incident = angular.copy($scope.newIncident);
        incident.student_id = gs.getUserID();
        incident.student_name = gs.getUserDisplayName();
        incident.student_email = gs.getUserEmail();
        
        $http.post('/api/x_1997678_acadreso/incidents', incident)
            .then(function(response) {
                alert('Incident created successfully!');
                $scope.newIncident = { incident_type: 'Damaged' };
                $scope.loadIncidents();
            });
    };
    
    // Initialize
    $scope.loadIncidents();
}]);
```

---

## PART 9: USER ROLES & ACCESS CONTROL

### Step 9.1: Create Roles
**Menu Path:** System Security > Roles**

1. **Role 1: acad_resolve_student**
   - **Role Name:** AcadResolve Student
   - **Permissions:**
     - Can view own incidents
     - Can submit new incidents
     - Can view payment status

2. **Role 2: acad_resolve_library_staff**
   - **Role Name:** AcadResolve Library Staff
   - **Permissions:**
     - Can view all incidents
     - Can assess incidents
     - Can upload photos
     - Can calculate fees

3. **Role 3: acad_resolve_manager**
   - **Role Name:** AcadResolve Manager
   - **Permissions:**
     - Can approve/reject incidents
     - Can override charges
     - Can waive fees
     - Can view reports

### Step 9.2: Create Access Control Rules
**Menu Path:** System Security > Access Control (ACL)**

1. **ACL for Book Incident Table:**
   - **Table:** x_1997678_acadreso_book_incident
   - **Role:** acad_resolve_student
   - **Allow:** Read, Create
   - **Conditions:**
     ```
     student_id = current_user.sys_id
     ```

2. **ACL for Library Staff:**
   - **Table:** x_1997678_acadreso_book_incident
   - **Role:** acad_resolve_library_staff
   - **Allow:** Read, Write, Create

3. **ACL for Manager:**
   - **Table:** x_1997678_acadreso_book_incident
   - **Role:** acad_resolve_manager
   - **Allow:** Read, Write, Create, Delete

---

## PART 10: USER & ADMIN IMPERSONATION FOR DEMO

### Step 10.1: Create Demo Users

**Menu Path:** System Security > Users**

1. **User 1: Demo Student**
   - **User ID:** demo.student
   - **First Name:** Demo
   - **Last Name:** Student
   - **Email:** demo.student@example.com
   - **Roles:** acad_resolve_student
   - **Department:** Student Affairs

2. **User 2: Demo Library Staff**
   - **User ID:** demo.librarian
   - **First Name:** Demo
   - **Last Name:** Librarian
   - **Email:** demo.librarian@example.com
   - **Roles:** acad_resolve_library_staff
   - **Department:** Library Services

3. **User 3: Demo Manager**
   - **User ID:** demo.manager
   - **First Name:** Demo
   - **Last Name:** Manager
   - **Email:** demo.manager@example.com
   - **Roles:** acad_resolve_manager, admin
   - **Department:** Library Services

### Step 10.2: Impersonation Steps

**To impersonate as admin:**
1. Click your user profile (top right) → Impersonate User
2. Search for demo.manager
3. Click Impersonate
4. Now you have full admin access

**To impersonate as student:**
1. Use the same impersonation feature
2. Search for demo.student
3. Click Impersonate
4. You'll only see your own incidents

**To impersonate as librarian:**
1. Search for demo.librarian
2. Click Impersonate
3. You can view and assess incidents

### Step 10.3: Demo Data Setup

Run this script in **System Console > Scripts - Background:**

```javascript
// Create demo fee configuration
var feeConfig = new GlideRecord('x_1997678_acadreso_fee_config');
feeConfig.config_name = 'Default Fee Configuration';
feeConfig.damage_fee_percent = 10;
feeConfig.loss_fee_percent = 100;
feeConfig.replacement_window_days = 30;
feeConfig.active = true;
feeConfig.insert();

// Create sample incidents
var books = [
    { title: 'Introduction to Algorithms', cost: 85.00 },
    { title: 'Data Structures & Algorithms', cost: 95.00 },
    { title: 'Discrete Mathematics', cost: 120.00 }
];

books.forEach(function(book) {
    var incident = new GlideRecord('x_1997678_acadreso_book_incident');
    incident.student_id = 'demo.student';
    incident.student_name = 'Demo Student';
    incident.student_email = 'demo.student@example.com';
    incident.book_title = book.title;
    incident.incident_type = 'Damaged';
    incident.incident_date = new GlideDateTime();
    incident.description = 'Accidental water damage to book';
    incident.replacement_cost = book.cost;
    incident.assessment_status = 'Pending';
    incident.payment_status = 'Pending';
    incident.insert();
});

gs.info('Demo data created successfully!');
```

---

## PART 11: DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tables created and configured
- [ ] Business rules tested
- [ ] Client scripts validated
- [ ] UI Actions working correctly
- [ ] Email notifications configured
- [ ] Flows tested end-to-end
- [ ] REST APIs tested
- [ ] AI integration credentials configured
- [ ] Service Portal widget deployed
- [ ] Roles and ACLs configured
- [ ] Demo data inserted

### Deployment Steps

1. **Activate Scoped Application:**
   - Go to **Studio > Your App > Activate**
   - Check "Version 1.0"

2. **Create Update Set:**
   - Go to **System Update > Update Sets > Create New**
   - **Name:** AcadResolve_v1.0
   - **Description:** Initial release of AcadResolve application

3. **Add Components:**
   - Add all tables, business rules, scripts, flows to update set

4. **Export/Deploy:**
   - Right-click Update Set → Export
   - OR Deploy directly to target instance

5. **Test in Target Environment:**
   - Run through demo scenarios
   - Verify user roles
   - Test notifications
   - Validate integrations

---

## PART 12: TESTING SCENARIOS

### Scenario 1: Student Reports Incident
1. Log in as **demo.student**
2. Navigate to **AcadResolve Portal**
3. Click "Report New Incident"
4. Fill in:
   - Book Title: "Introduction to Algorithms"
   - Incident Type: "Damaged"
   - Description: "Coffee spilled on pages"
5. Click Submit
6. Verify incident appears in list

### Scenario 2: Librarian Assesses Incident
1. Log in as **demo.librarian** (impersonate)
2. Go to **AcadResolve > Book Incidents**
3. Open the incident created in Scenario 1
4. Click **Assess** button
5. Verify damage fee calculated (10% of $85 = $8.50)
6. Total charge: $93.50

### Scenario 3: Manager Approves & Requests Payment
1. Log in as **demo.manager**
2. Open the assessed incident
3. Click **Approve** button
4. Click **Request Payment**
5. Verify student receives email notification

### Scenario 4: Student Receives Payment Request
1. Check email for student (demo.student@example.com)
2. Verify email contains:
   - Amount Due: $93.50
   - Incident Details
   - Link to respond

---

## APPENDIX: QUICK REFERENCE

### Table Names
- `x_1997678_acadreso_book_incident` - Main incident table
- `x_1997678_acadreso_fee_config` - Fee configuration

### REST API Endpoints
- `GET /api/x_1997678_acadreso/incidents` - List incidents
- `POST /api/x_1997678_acadreso/incidents` - Create incident
- `PATCH /api/x_1997678_acadreso/incidents/{sys_id}` - Update incident

### Event Names
- `x_1997678_acadreso.incident.status_changed`
- `x_1997678_acadreso.incident.approved`
- `x_1997678_acadreso.payment_request`

### Demo User Credentials
- **Student:** demo.student / password
- **Librarian:** demo.librarian / password
- **Manager:** demo.manager / password

---

## Support & Troubleshooting

### Common Issues

**Issue:** Notifications not sending
**Solution:** Verify email server settings under System Properties > Email

**Issue:** Incidents not calculating fees
**Solution:** Check fee_config table has active=true record

**Issue:** Integrations failing
**Solution:** Verify API credentials in System Integrations > Credentials

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-21  
**Created for:** PDI Zurich Instance  
**Scope:** x_1997678_acadreso

