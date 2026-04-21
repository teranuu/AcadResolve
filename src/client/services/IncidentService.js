export class IncidentService {
    constructor() {
        this.baseUrl = '/api/x_1997678_acadreso'
    }

    // Return all incidents
    async list() {
        try {
            const response = await fetch(`${this.baseUrl}/incidents`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || `HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error fetching incidents:', error)
            throw error
        }
    }

    // Get incidents for current student
    async listByStudent(studentId) {
        try {
            const response = await fetch(`${this.baseUrl}/students/${studentId}/incidents`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error fetching student incidents:', error)
            throw error
        }
    }

    // Get a single incident by sys_id
    async get(sysId) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents/${sysId}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error(`Error fetching incident ${sysId}:`, error)
            throw error
        }
    }

    // Create a new incident
    async create(data) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || `HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error creating incident:', error)
            throw error
        }
    }

    // Update an incident
    async update(sysId, data) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents/${sysId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || `HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error(`Error updating incident ${sysId}:`, error)
            throw error
        }
    }

    // Calculate fee
    async calculateFee(replacementCost, incidentType) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents/calculate-fee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    replacement_cost: replacementCost,
                    incident_type: incidentType,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error calculating fee:', error)
            throw error
        }
    }

    // Assess incident
    async assess(sysId) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents/${sysId}/assess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error assessing incident:', error)
            throw error
        }
    }

    // Approve incident
    async approve(sysId) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents/${sysId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error approving incident:', error)
            throw error
        }
    }

    // Reject incident
    async reject(sysId, reason) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents/${sysId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ reason }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error rejecting incident:', error)
            throw error
        }
    }

    // Record payment
    async recordPayment(sysId, paymentStatus) {
        try {
            const response = await fetch(`${this.baseUrl}/incidents/${sysId}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ payment_status: paymentStatus }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error recording payment:', error)
            throw error
        }
    }

    // Get dashboard stats
    async getDashboardStats() {
        try {
            const response = await fetch(`${this.baseUrl}/dashboard/stats`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
            throw error
        }
    }
}

