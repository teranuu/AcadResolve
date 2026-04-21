export class IncidentService {
    constructor() {
        this.baseUrl = '/api/now/v2/table/x_1997678_acadreso_book_incident'
        this.currentUser = null
        this.currentRole = null
    }

    // Set current user and role for filtering
    setUser(user, role) {
        this.currentUser = user
        this.currentRole = role
    }

    // Return incidents filtered by role
    async list() {
        try {
            const response = await fetch(`${this.baseUrl}?sysparm_limit=100&sysparm_exclude_reference_link=true`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error ${response.status}: ${errorText || 'Unknown error'}`)
            }

            const data = await response.json()
            let incidents = data.result || []

            // Validate response
            if (!Array.isArray(incidents)) {
                console.warn('API response is not an array, converting to empty array')
                incidents = []
            }

            // Filter based on current user role
            if (this.currentRole === 'student' && this.currentUser) {
                // Students can only see their own incidents (match by username in email or name field)
                incidents = incidents.filter((incident) => {
                    const studentEmail = incident.student_email || ''
                    const studentName = incident.student_name || ''
                    return (
                        studentEmail.toLowerCase() === this.currentUser.toLowerCase() ||
                        studentName.toLowerCase() === this.currentUser.toLowerCase() ||
                        studentEmail.includes(this.currentUser.toLowerCase())
                    )
                })
            } else if (this.currentRole === 'manager') {
                // Managers see incidents pending assessment or approval
                incidents = incidents.filter(
                    (incident) =>
                        (incident.assessment_status || '').toLowerCase() === 'pending' ||
                        (incident.approval_status || '').toLowerCase() === 'pending'
                )
            }
            // Admin sees all incidents

            return incidents
        } catch (error) {
            console.error('Error fetching incidents:', error)
            throw new Error(`Failed to fetch incidents: ${error.message}`)
        }
    }

    // Get a single incident by sys_id
    async get(sysId) {
        try {
            const response = await fetch(`${this.baseUrl}/${sysId}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            const data = await response.json()
            return data.result || data
        } catch (error) {
            console.error(`Error fetching incident ${sysId}:`, error)
            throw error
        }
    }

    // Create a new incident
    async create(data) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            const result = await response.json()
            return result.result || result
        } catch (error) {
            console.error('Error creating incident:', error)
            throw error
        }
    }

    // Update an incident
    async update(sysId, data) {
        try {
            const response = await fetch(`${this.baseUrl}/${sysId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            const result = await response.json()
            return result.result || result
        } catch (error) {
            console.error(`Error updating incident ${sysId}:`, error)
            throw error
        }
    }

    // Calculate fee (local calculation)
    async calculateFee(replacementCost, incidentType) {
        try {
            // Local calculation since we don't have a server endpoint
            const damageFeePercent = 10
            const lossFeePercent = 100
            
            const feePercent = incidentType === 'Loss' ? lossFeePercent : damageFeePercent
            const damageFee = replacementCost * (feePercent / 100)
            const totalCharge = replacementCost + damageFee

            return {
                replacement_cost: replacementCost,
                fee_percent: feePercent,
                damage_fee: damageFee,
                total_charge: totalCharge,
            }
        } catch (error) {
            console.error('Error calculating fee:', error)
            throw error
        }
    }

    // Get dashboard stats filtered by role
    async getDashboardStats() {
        try {
            const incidents = await this.list()
            
            // Validate incidents array
            if (!Array.isArray(incidents)) {
                throw new Error('Invalid incidents data')
            }

            const totalIncidents = incidents.length
            const pendingCount = incidents.filter(
                (i) => (i.assessment_status || '').toLowerCase() === 'pending'
            ).length
            const approvalCount = incidents.filter(
                (i) => (i.approval_status || '').toLowerCase() === 'pending'
            ).length
            const paymentCount = incidents.filter(
                (i) => (i.payment_status || '').toLowerCase() === 'pending'
            ).length
            
            // Calculate total charges with validation
            const totalCharges = incidents.reduce((sum, i) => {
                const charge = parseFloat(i.total_charge)
                return sum + (isNaN(charge) ? 0 : charge)
            }, 0)

            // Adjust stats display based on role
            let statsLabel = {
                total: 'Total Incidents',
                pending: 'Pending Assessment',
                approval: 'Pending Approval',
                payment: 'Pending Payment',
            }

            if (this.currentRole === 'student') {
                statsLabel = {
                    total: 'My Incidents',
                    pending: 'Awaiting Assessment',
                    approval: 'Awaiting Approval',
                    payment: 'Payment Required',
                }
            } else if (this.currentRole === 'manager') {
                statsLabel = {
                    total: 'Incidents to Review',
                    pending: 'To Assess',
                    approval: 'To Approve',
                    payment: 'Unpaid',
                }
            }

            return {
                total_incidents: totalIncidents,
                pending_assessment: pendingCount,
                pending_approval: approvalCount,
                pending_payment: paymentCount,
                total_charges: totalCharges.toFixed(2),
                labels: statsLabel,
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
            // Return default stats on error instead of throwing
            return {
                total_incidents: 0,
                pending_assessment: 0,
                pending_approval: 0,
                pending_payment: 0,
                total_charges: '0.00',
                labels: {
                    total: 'Total Incidents',
                    pending: 'Pending Assessment',
                    approval: 'Pending Approval',
                    payment: 'Pending Payment',
                },
            }
        }
    }

    // Delete incident (admin only)
    async delete(sysId) {
        try {
            if (this.currentRole !== 'admin') {
                throw new Error('Only admins can delete incidents')
            }

            const response = await fetch(`${this.baseUrl}/${sysId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error ${response.status}: ${errorText || 'Failed to delete'}`)
            }

            return { success: true }
        } catch (error) {
            console.error(`Error deleting incident ${sysId}:`, error)
            throw error
        }
    }

    // Assess incident and calculate fees (manager/admin)
    async assess(sysId) {
        try {
            if (!['manager', 'admin'].includes(this.currentRole)) {
                throw new Error('Only managers and admins can assess incidents')
            }

            console.log(`[Service] Assessing incident: ${sysId}`);
            // Get current incident to calculate fees
            const incident = await this.get(sysId)
            const replacementCost = parseFloat(incident.replacement_cost) || 0
            const incidentType = incident.incident_type || 'Damaged'

            console.log(`[Service] Current incident: Assessment=${incident.assessment_status}, Approval=${incident.approval_status}`);

            // Calculate fees
            const feeCalc = await this.calculateFee(replacementCost, incidentType)
            console.log(`[Service] Calculated fees: ${JSON.stringify(feeCalc)}`);

            // Update incident with assessment
            const response = await fetch(`${this.baseUrl}/${sysId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    assessment_status: 'Assessed',
                    damage_fee: feeCalc.damage_fee,
                    total_charge: feeCalc.total_charge,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error ${response.status}: ${errorText}`)
            }

            const result = await response.json()
            const returnData = result.result || result
            console.log(`[Service] Assess response:`, returnData);
            return returnData
        } catch (error) {
            console.error(`Error assessing incident ${sysId}:`, error)
            throw error
        }
    }

    // Approve incident (manager/admin)
    async approve(sysId) {
        try {
            if (!['manager', 'admin'].includes(this.currentRole)) {
                throw new Error('Only managers and admins can approve incidents')
            }

            console.log(`[Service] Approving incident: ${sysId}`);
            const response = await fetch(`${this.baseUrl}/${sysId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    approval_status: 'Approved',
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error ${response.status}: ${errorText}`)
            }

            const result = await response.json()
            const returnData = result.result || result
            console.log(`[Service] Approve response:`, returnData);
            return returnData
        } catch (error) {
            console.error(`Error approving incident ${sysId}:`, error)
            throw error
        }
    }

    // Reject incident with reason (manager/admin)
    async reject(sysId, reason) {
        try {
            if (!['manager', 'admin'].includes(this.currentRole)) {
                throw new Error('Only managers and admins can reject incidents')
            }

            const response = await fetch(`${this.baseUrl}/${sysId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    approval_status: 'Rejected',
                    rejection_reason: reason,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            const result = await response.json()
            return result.result || result
        } catch (error) {
            console.error(`Error rejecting incident ${sysId}:`, error)
            throw error
        }
    }

    // Record payment (manager/admin)
    async recordPayment(sysId, paymentStatus) {
        try {
            if (!['manager', 'admin'].includes(this.currentRole)) {
                throw new Error('Only managers and admins can record payments')
            }

            const response = await fetch(`${this.baseUrl}/${sysId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    payment_status: paymentStatus,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            const result = await response.json()
            return result.result || result
        } catch (error) {
            console.error(`Error recording payment for ${sysId}:`, error)
            throw error
        }
    }
}
