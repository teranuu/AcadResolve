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
            const response = await fetch(`${this.baseUrl}?sysparm_limit=100`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            const data = await response.json()
            let incidents = data.result || []

            // Filter based on current user role
            if (this.currentRole === 'student' && this.currentUser) {
                // Students can only see their own incidents
                incidents = incidents.filter(
                    (incident) =>
                        incident.student_email === this.currentUser ||
                        incident.student_name === this.currentUser
                )
            } else if (this.currentRole === 'manager') {
                // Managers see incidents pending assessment or approval
                incidents = incidents.filter(
                    (incident) =>
                        incident.assessment_status === 'Pending' ||
                        incident.approval_status === 'Pending'
                )
            }
            // Admin sees all incidents

            return incidents
        } catch (error) {
            console.error('Error fetching incidents:', error)
            throw error
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
            
            const totalIncidents = incidents.length
            const pendingCount = incidents.filter(i => i.assessment_status === 'Pending').length
            const approvalCount = incidents.filter(i => i.approval_status === 'Pending').length
            const paymentCount = incidents.filter(i => i.payment_status === 'Pending').length
            const totalCharges = incidents.reduce((sum, i) => sum + (parseFloat(i.total_charge) || 0), 0)

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
            throw error
        }
    }

    // Placeholder methods for future custom endpoints
    async assess(sysId) {
        // TODO: Implement via Business Rule or Flow
        return { status: 'pending' }
    }

    async approve(sysId) {
        // TODO: Implement via Business Rule or Flow
        return { status: 'pending' }
    }

    async reject(sysId, reason) {
        // TODO: Implement via Business Rule or Flow
        return { status: 'pending' }
    }

    async recordPayment(sysId, paymentStatus) {
        // TODO: Implement via Business Rule or Flow
        return { status: 'pending' }
    }
}
