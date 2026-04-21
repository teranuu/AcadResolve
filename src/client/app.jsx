import React, { useState, useEffect, useMemo } from 'react'
import { IncidentService } from './services/IncidentService'
import IncidentList from './components/IncidentList'
import IncidentForm from './components/IncidentForm'
import './app.css'

export default function App() {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState(null)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState(null)
    const [filter, setFilter] = useState('all') // all, pending, assessed, approved

    const incidentService = useMemo(() => new IncidentService(), [])

    const refreshIncidents = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await incidentService.list()
            setIncidents(data)
            
            // Fetch stats
            const statsData = await incidentService.getDashboardStats()
            setStats(statsData)
        } catch (err) {
            setError('Failed to load incidents: ' + (err.message || 'Unknown error'))
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void refreshIncidents()
    }, [])

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
                await incidentService.update(selectedIncident.sys_id, formData)
                alert('Incident updated successfully!')
            } else {
                const result = await incidentService.create(formData)
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
            <header className="app-header">
                <div className="header-content">
                    <h1>📚 AcadResolve - Book Incident Management</h1>
                    <p className="subtitle">
                        Fair charges for lost/damaged items with integrated assessment and settlement
                    </p>
                </div>
                <button className="create-button" onClick={handleCreateClick}>
                    + Report Incident
                </button>
            </header>

            {/* Dashboard Stats */}
            {stats && (
                <div className="dashboard-stats">
                    <div className="stat-card">
                        <h3>Total Incidents</h3>
                        <p className="stat-value">{stats.total_incidents}</p>
                    </div>
                    <div className="stat-card pending">
                        <h3>Pending Assessment</h3>
                        <p className="stat-value">{stats.pending_assessment}</p>
                    </div>
                    <div className="stat-card approval">
                        <h3>Pending Approval</h3>
                        <p className="stat-value">{stats.pending_approval}</p>
                    </div>
                    <div className="stat-card payment">
                        <h3>Pending Payment</h3>
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
                    Assessed ({incidents.filter((i) => i.assessment_status === 'Assessed').length})
                </button>
                <button
                    className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Approved ({incidents.filter((i) => i.approval_status === 'Approved').length})
                </button>
            </div>

            {/* Incident List */}
            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading book incidents...</p>
                </div>
            ) : (
                <IncidentList
                    incidents={filteredIncidents}
                    onEdit={handleEditClick}
                    onRefresh={refreshIncidents}
                    service={incidentService}
                />
            )}

            {/* Incident Form Modal */}
            {showForm && (
                <IncidentForm
                    incident={selectedIncident}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormClose}
                    service={incidentService}
                />
            )}
        </div>
    )
}

