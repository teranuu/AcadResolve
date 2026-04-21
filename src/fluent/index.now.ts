import '@servicenow/sdk/global'
import { Endpoint, Now } from '@servicenow/sdk/core'

/**
 * ============================================
 * AcadResolve Fluent API Endpoints
 * Scope: x_1997678_acadreso
 * ============================================
 */

// API: Get all book incidents
Endpoint({
    $id: 'get_incidents',
    path: '/incidents',
    async execute(request, response) {
        try {
            const incidents: any[] = []
            const gr = new GlideRecord('x_1997678_acadreso_book_incident')
            gr.query()

            while (gr.next()) {
                incidents.push({
                    sys_id: gr.sys_id.toString(),
                    incident_number: gr.incident_number.toString(),
                    student_id: gr.student_id.toString(),
                    student_name: gr.student_name.toString(),
                    book_title: gr.book_title.toString(),
                    incident_type: gr.incident_type.toString(),
                    incident_date: gr.incident_date.toString(),
                    assessment_status: gr.assessment_status.toString(),
                    total_charge: gr.total_charge.toString(),
                    payment_status: gr.payment_status.toString(),
                    approval_status: gr.approval_status.toString(),
                })
            }

            response.status = 200
            return incidents
        } catch (error) {
            response.status = 500
            return { error: error.message }
        }
    },
})

// API: Get single incident by sys_id
Endpoint({
    $id: 'get_incident',
    path: '/incidents/{sys_id}',
    async execute(request, response) {
        try {
            const sysId = request.pathParams.sys_id
            const gr = new GlideRecord('x_1997678_acadreso_book_incident')

            if (gr.get(sysId)) {
                response.status = 200
                return {
                    sys_id: gr.sys_id.toString(),
                    incident_number: gr.incident_number.toString(),
                    student_id: gr.student_id.toString(),
                    student_name: gr.student_name.toString(),
                    student_email: gr.student_email.toString(),
                    book_title: gr.book_title.toString(),
                    book_isbn: gr.book_isbn.toString(),
                    item_id: gr.item_id.toString(),
                    incident_type: gr.incident_type.toString(),
                    incident_date: gr.incident_date.toString(),
                    description: gr.description.toString(),
                    photo_url: gr.photo_url.toString(),
                    assessment_status: gr.assessment_status.toString(),
                    replacement_cost: gr.replacement_cost.toString(),
                    damage_fee: gr.damage_fee.toString(),
                    total_charge: gr.total_charge.toString(),
                    payment_status: gr.payment_status.toString(),
                    approval_status: gr.approval_status.toString(),
                }
            }

            response.status = 404
            return { error: 'Incident not found' }
        } catch (error) {
            response.status = 500
            return { error: error.message }
        }
    },
})

// API: Create new incident
Endpoint({
    $id: 'create_incident',
    path: '/incidents',
    methods: ['POST'],
    async execute(request, response) {
        try {
            const body = request.body.getReader().readLine()
            const data = JSON.parse(body)

            const gr = new GlideRecord('x_1997678_acadreso_book_incident')
            gr.student_id = data.student_id
            gr.student_name = data.student_name
            gr.student_email = data.student_email
            gr.book_title = data.book_title
            gr.book_isbn = data.book_isbn || ''
            gr.item_id = data.item_id || ''
            gr.incident_type = data.incident_type || 'Damaged'
            gr.incident_date = data.incident_date
            gr.description = data.description || ''
            gr.photo_url = data.photo_url || ''
            gr.replacement_cost = data.replacement_cost || 0
            gr.assessment_status = 'Pending'
            gr.payment_status = 'Pending'
            gr.approval_status = 'Pending'

            const sysId = gr.insert()

            response.status = 201
            return {
                sys_id: sysId,
                incident_number: gr.incident_number.toString(),
                status: 'created',
            }
        } catch (error) {
            response.status = 400
            return { error: error.message }
        }
    },
})

// API: Update incident
Endpoint({
    $id: 'update_incident',
    path: '/incidents/{sys_id}',
    methods: ['PATCH'],
    async execute(request, response) {
        try {
            const sysId = request.pathParams.sys_id
            const body = request.body.getReader().readLine()
            const data = JSON.parse(body)

            const gr = new GlideRecord('x_1997678_acadreso_book_incident')
            if (!gr.get(sysId)) {
                response.status = 404
                return { error: 'Incident not found' }
            }

            // Update only allowed fields
            const allowedFields = [
                'description',
                'incident_type',
                'replacement_cost',
                'resolution_option',
                'payment_status',
                'assessment_status',
            ]
            for (const key of allowedFields) {
                if (key in data && gr.isValidField(key)) {
                    gr[key] = data[key]
                }
            }

            gr.update()

            response.status = 200
            return { status: 'updated', sys_id: sysId }
        } catch (error) {
            response.status = 400
            return { error: error.message }
        }
    },
})

// API: Get incidents by student
Endpoint({
    $id: 'get_student_incidents',
    path: '/students/{student_id}/incidents',
    async execute(request, response) {
        try {
            const studentId = request.pathParams.student_id
            const incidents: any[] = []

            const gr = new GlideRecord('x_1997678_acadreso_book_incident')
            gr.addQuery('student_id', studentId)
            gr.orderByDesc('incident_date')
            gr.query()

            while (gr.next()) {
                incidents.push({
                    sys_id: gr.sys_id.toString(),
                    incident_number: gr.incident_number.toString(),
                    book_title: gr.book_title.toString(),
                    incident_type: gr.incident_type.toString(),
                    assessment_status: gr.assessment_status.toString(),
                    total_charge: gr.total_charge.toString(),
                    payment_status: gr.payment_status.toString(),
                })
            }

            response.status = 200
            return incidents
        } catch (error) {
            response.status = 500
            return { error: error.message }
        }
    },
})

// API: Calculate fee for incident
Endpoint({
    $id: 'calculate_fee',
    path: '/incidents/calculate-fee',
    methods: ['POST'],
    async execute(request, response) {
        try {
            const body = request.body.getReader().readLine()
            const data = JSON.parse(body)

            // Get fee configuration
            const configGr = new GlideRecord('x_1997678_acadreso_fee_config')
            configGr.addQuery('active', true)
            configGr.setLimit(1)
            configGr.query()

            let damageFeePercent = 10
            let lossFeePercent = 100

            if (configGr.next()) {
                damageFeePercent = parseFloat(configGr.damage_fee_percent.toString())
                lossFeePercent = parseFloat(configGr.loss_fee_percent.toString())
            }

            const replacementCost = parseFloat(data.replacement_cost) || 0
            const incidentType = data.incident_type || 'Damaged'

            const feePercent = incidentType === 'Loss' ? lossFeePercent : damageFeePercent
            const damageFee = replacementCost * (feePercent / 100)
            const totalCharge = replacementCost + damageFee

            response.status = 200
            return {
                replacement_cost: replacementCost,
                fee_percent: feePercent,
                damage_fee: damageFee,
                total_charge: totalCharge,
            }
        } catch (error) {
            response.status = 400
            return { error: error.message }
        }
    },
})

// API: Get dashboard statistics
Endpoint({
    $id: 'get_dashboard_stats',
    path: '/dashboard/stats',
    async execute(request, response) {
        try {
            // Total incidents
            const allGr = new GlideRecord('x_1997678_acadreso_book_incident')
            const totalIncidents = allGr.getRowCount()

            // Pending assessment
            const pendingGr = new GlideRecord('x_1997678_acadreso_book_incident')
            pendingGr.addQuery('assessment_status', 'Pending')
            const pendingCount = pendingGr.getRowCount()

            // Pending approval
            const approvalGr = new GlideRecord('x_1997678_acadreso_book_incident')
            approvalGr.addQuery('approval_status', 'Pending')
            const approvalCount = approvalGr.getRowCount()

            // Pending payment
            const paymentGr = new GlideRecord('x_1997678_acadreso_book_incident')
            paymentGr.addQuery('payment_status', 'Pending')
            const paymentCount = paymentGr.getRowCount()

            // Total charges
            const chargeGr = new GlideRecord('x_1997678_acadreso_book_incident')
            let totalCharges = 0
            chargeGr.query()
            while (chargeGr.next()) {
                totalCharges += parseFloat(chargeGr.total_charge.toString())
            }

            response.status = 200
            return {
                total_incidents: totalIncidents,
                pending_assessment: pendingCount,
                pending_approval: approvalCount,
                pending_payment: paymentCount,
                total_charges: totalCharges.toFixed(2),
            }
        } catch (error) {
            response.status = 500
            return { error: error.message }
        }
    },
})

// API: Assess incident (calculate and auto-approve if needed)
Endpoint({
    $id: 'assess_incident',
    path: '/incidents/{sys_id}/assess',
    methods: ['POST'],
    async execute(request, response) {
        try {
            const sysId = request.pathParams.sys_id
            const gr = new GlideRecord('x_1997678_acadreso_book_incident')

            if (!gr.get(sysId)) {
                response.status = 404
                return { error: 'Incident not found' }
            }

            // Get fee configuration
            const configGr = new GlideRecord('x_1997678_acadreso_fee_config')
            configGr.addQuery('active', true)
            configGr.setLimit(1)
            configGr.query()

            if (configGr.next()) {
                const feePercent =
                    gr.incident_type.toString() === 'Loss'
                        ? parseFloat(configGr.loss_fee_percent.toString())
                        : parseFloat(configGr.damage_fee_percent.toString())

                const replacementCost = parseFloat(gr.replacement_cost.toString())
                const damageFee = replacementCost * (feePercent / 100)
                gr.damage_fee = damageFee
                gr.total_charge = replacementCost + damageFee
            }

            gr.assessment_status = 'Assessed'
            gr.assessed_by = gs.getUserID()

            // Auto-approve if low value
            if (parseFloat(gr.total_charge.toString()) < 50) {
                gr.approval_status = 'Approved'
                gr.approved_by = gs.getUserID()

                // Trigger event for notification
                gs.eventQueue('x_1997678_acadreso.incident.approved', gr.sys_id)
            }

            gr.update()

            response.status = 200
            return {
                status: 'assessed',
                damage_fee: gr.damage_fee.toString(),
                total_charge: gr.total_charge.toString(),
                auto_approved: gr.approval_status.toString() === 'Approved',
            }
        } catch (error) {
            response.status = 400
            return { error: error.message }
        }
    },
})

// API: Approve incident
Endpoint({
    $id: 'approve_incident',
    path: '/incidents/{sys_id}/approve',
    methods: ['POST'],
    async execute(request, response) {
        try {
            const sysId = request.pathParams.sys_id
            const gr = new GlideRecord('x_1997678_acadreso_book_incident')

            if (!gr.get(sysId)) {
                response.status = 404
                return { error: 'Incident not found' }
            }

            gr.approval_status = 'Approved'
            gr.approved_by = gs.getUserID()
            gr.update()

            // Trigger event for payment request notification
            gs.eventQueue('x_1997678_acadreso.incident.approved', gr.sys_id)

            response.status = 200
            return { status: 'approved' }
        } catch (error) {
            response.status = 400
            return { error: error.message }
        }
    },
})

// API: Reject incident
Endpoint({
    $id: 'reject_incident',
    path: '/incidents/{sys_id}/reject',
    methods: ['POST'],
    async execute(request, response) {
        try {
            const sysId = request.pathParams.sys_id
            const body = request.body.getReader().readLine()
            const data = JSON.parse(body)

            const gr = new GlideRecord('x_1997678_acadreso_book_incident')
            if (!gr.get(sysId)) {
                response.status = 404
                return { error: 'Incident not found' }
            }

            gr.approval_status = 'Rejected'
            gr.notes = (gr.notes.toString() || '') + '\n\nRejection reason: ' + (data.reason || 'No reason provided')
            gr.update()

            response.status = 200
            return { status: 'rejected' }
        } catch (error) {
            response.status = 400
            return { error: error.message }
        }
    },
})

// API: Record payment
Endpoint({
    $id: 'record_payment',
    path: '/incidents/{sys_id}/payment',
    methods: ['POST'],
    async execute(request, response) {
        try {
            const sysId = request.pathParams.sys_id
            const body = request.body.getReader().readLine()
            const data = JSON.parse(body)

            const gr = new GlideRecord('x_1997678_acadreso_book_incident')
            if (!gr.get(sysId)) {
                response.status = 404
                return { error: 'Incident not found' }
            }

            gr.payment_status = data.payment_status || 'Paid'
            gr.resolved_date = new GlideDateTime()

            if (data.payment_status === 'Paid') {
                gr.payment_status = 'Paid'
            } else if (data.payment_status === 'Waived') {
                gr.payment_status = 'Waived'
            }

            gr.notes =
                (gr.notes.toString() || '') +
                '\n\nPayment: ' +
                (data.payment_status || 'recorded') +
                ' on ' +
                new GlideDateTime().getDisplayValue()

            gr.update()

            // Trigger event for confirmation
            gs.eventQueue('x_1997678_acadreso.payment_received', gr.sys_id)

            response.status = 200
            return { status: 'payment_recorded', payment_status: gr.payment_status.toString() }
        } catch (error) {
            response.status = 400
            return { error: error.message }
        }
    },
})

export default {}

