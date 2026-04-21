import React, { useState, useEffect, useMemo } from 'react'
import { IncidentService } from './services/IncidentService'
import IncidentList from './components/IncidentList'
import IncidentForm from './components/IncidentForm'
import NavBar from './components/NavBar'
import './app.css'

export default function App() {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState(null)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState(null)
    const [filter, setFilter] = useState('all') // all, pending, assessed, approved
    const [user, setUser] = useState(null) // { username, role, email }

    const incidentService = useMemo(() => new IncidentService(), [])

    // Initialize app on mount
    useEffect(() => {
        setLoading(false)
    }, [])

    // Handle login
    const handleLogin = (credentials) => {
        const userData = {
            username: credentials.username,
            role: credentials.role,
            email: `${credentials.username}@acadresolve.edu`,
        }
        setUser(userData)
        incidentService.setUser(credentials.username, credentials.role)

        // Show welcome message
        alert(`Welcome ${credentials.username}! Logged in as ${credentials.role.toUpperCase()}`)
    }

    // Handle logout
    const handleLogout = () => {
        console.log('[App] handleLogout called')
        setUser(null)
        setIncidents([])
        setStats(null)
        incidentService.setUser(null, null)
        setShowForm(false)
        setSelectedIncident(null)
        console.log('[App] User logged out, state cleared')
        alert('You have been logged out')
    }

    const refreshIncidents = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            
            console.log(`[App] Refreshing incidents for user: ${user.username} (${user.role})`)
            // Fetch incidents with role-based filtering
            const data = await incidentService.list()
            if (!Array.isArray(data)) {
                throw new Error('Invalid response format: expected array')
            }
            console.log(`[App] Fetched ${data.length} incidents:`, data.map(d => ({
                sys_id: d.sys_id,
                assessment_status: d.assessment_status,
                approval_status: d.approval_status,
                payment_status: d.payment_status,
                incident_number: d.incident_number
            })))
            setIncidents(data)
            
            // Fetch stats
            const statsData = await incidentService.getDashboardStats()
            if (!statsData) {
                throw new Error('Failed to fetch dashboard stats')
            }
            console.log(`[App] Stats updated:`, statsData)
            setStats(statsData)
        } catch (err) {
            console.error('[App] Error fetching incidents:', err)
            setError('Failed to load incidents: ' + (err.message || 'Unknown error'))
            setIncidents([])
            setStats(null)
        } finally {
            setLoading(false)
        }
    }

    // Fetch incidents when user changes
    useEffect(() => {
        if (user) {
            void refreshIncidents()
        }
    }, [user])

    const handleCreateClick = () => {
        setSelectedIncident(null)
        setShowForm(true)
    }

    const handleEditClick = (incident) => {
        setSelectedIncident(incident)
        setShowForm(true)
    }

    const handleFormClose = () => {
        setShowForm(false)
        setSelectedIncident(null)
    }

    const handleFormSubmit = async (formData) => {
        setLoading(true)
        try {
            if (selectedIncident) {
                // Editing - preserve original student info, update only editable fields
                const updateData = {
                    book_title: formData.book_title,
                    book_isbn: formData.book_isbn,
                    incident_type: formData.incident_type,
                    incident_date: formData.incident_date,
                    description: formData.description,
                    replacement_cost: formData.replacement_cost,
                    photo_url: formData.photo_url,
                }
                await incidentService.update(selectedIncident.sys_id, updateData)
                alert('Incident updated successfully!')
            } else {
                // Creating new - add logged-in user info
                const dataWithUser = {
                    ...formData,
                    student_name: user.username,
                    student_email: user.email,
                }
                const result = await incidentService.create(dataWithUser)
                alert(`Incident created: ${result.incident_number}`)
            }
            setShowForm(false)
            await refreshIncidents()
        } catch (err) {
            setError('Failed to save incident: ' + (err.message || 'Unknown error'))
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Filter incidents based on selected filter
    const filteredIncidents = incidents.filter((incident) => {
        if (filter === 'all') return true
        if (filter === 'pending') return incident.assessment_status === 'Pending'
        if (filter === 'assessed') return incident.assessment_status === 'Assessed'
        if (filter === 'approved') return incident.approval_status === 'Approved'
        return true
    })

    return (
        <div className="incident-app">
            <NavBar user={user} onLogin={handleLogin} onLogout={handleLogout} />

            {!user ? (
                <div className="login-prompt">
                    <div className="prompt-card">
                        <h2>🔐 Please Log In</h2>
                        <p>Click the Login button in the navigation bar to access AcadResolve</p>
                        <div className="role-info">
                            <div className="role-card">
                                <h3>🎓 Student</h3>
                                <p>Report and track your incidents</p>
                            </div>
                            <div className="role-card">
                                <h3>👔 Manager</h3>
                                <p>Assess and approve incidents</p>
                            </div>
                            <div className="role-card">
                                <h3>👑 Admin</h3>
                                <p>Full system access</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <header className="app-header">
                        <div className="header-content">
                            <h1>📚 AcadResolve - Book Incident Management</h1>
                            <p className="subtitle">
                                Fair charges for lost/damaged items with integrated assessment and settlement
                            </p>
                        </div>
                        {(user.role === 'student' || user.role === 'admin') && (
                            <button className="create-button" onClick={handleCreateClick}>
                                + Report Incident
                            </button>
                        )}
                    </header>

                    {/* Dashboard Stats */}
                    {stats && (
                        <div className="dashboard-stats">
                            <div className="stat-card">
                                <h3>{stats.labels?.total || 'Total Incidents'}</h3>
                                <p className="stat-value">{stats.total_incidents}</p>
                            </div>
                            <div className="stat-card pending">
                                <h3>{stats.labels?.pending || 'Pending Assessment'}</h3>
                                <p className="stat-value">{stats.pending_assessment}</p>
                            </div>
                            <div className="stat-card approval">
                                <h3>{stats.labels?.approval || 'Pending Approval'}</h3>
                                <p className="stat-value">{stats.pending_approval}</p>
                            </div>
                            <div className="stat-card payment">
                                <h3>{stats.labels?.payment || 'Pending Payment'}</h3>
                                <p className="stat-value">{stats.pending_payment}</p>
                            </div>
                            <div className="stat-card charges">
                                <h3>Total Charges</h3>
                                <p className="stat-value">${parseFloat(stats.total_charges || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <span>{error}</span>
                            <button onClick={() => setError(null)}>Dismiss</button>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Incidents ({incidents.length})
                        </button>
                        <button
                            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pending Assessment (
                            {incidents.filter((i) => i.assessment_status === 'Pending').length})
                        </button>
                        <button
                            className={`filter-btn ${filter === 'assessed' ? 'active' : ''}`}
                            onClick={() => setFilter('assessed')}
                        >
                            Assessed (
                            {incidents.filter((i) => i.assessment_status === 'Assessed').length})
                        </button>
                        <button
                            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                            onClick={() => setFilter('approved')}
                        >
                            Approved (
                            {incidents.filter((i) => i.approval_status === 'Approved').length})
                        </button>
                    </div>

                    {/* Main Content */}
                    {loading ? (
                        <div className="loading">Loading incidents...</div>
                    ) : filteredIncidents.length === 0 ? (
                        <div className="no-incidents">
                            <p>📭 No incidents found</p>
                        </div>
                    ) : (
                        <IncidentList
                            incidents={filteredIncidents}
                            onEdit={handleEditClick}
                            onRefresh={refreshIncidents}
                            service={incidentService}
                            userRole={user.role}
                        />
                    )}

                    {/* Modal Form */}
                    {showForm && (
                        <div className="modal-overlay" onClick={handleFormClose}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <IncidentForm
                                    incident={selectedIncident}
                                    onSubmit={handleFormSubmit}
                                    onCancel={handleFormClose}
                                    service={incidentService}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

