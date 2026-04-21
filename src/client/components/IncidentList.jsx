import React from 'react'
import './IncidentList.css'

export default function IncidentList({ incidents, onEdit, onRefresh, onAction, service }) {
    const getStatusClass = (status) => {
        switch (status) {
            case 'Pending':
                return 'status-pending'
            case 'Assessed':
                return 'status-assessed'
            case 'Approved':
                return 'status-approved'
            case 'Paid':
                return 'status-paid'
            case 'Rejected':
                return 'status-rejected'
            default:
                return ''
        }
    }

    const handleAssess = async (incident) => {
        if (!window.confirm('Assess this incident and calculate fees?')) {
            return
        }
        try {
            await service.assess(incident.sys_id)
            alert('Incident assessed successfully!')
            onRefresh()
        } catch (error) {
            alert('Failed to assess incident: ' + error.message)
        }
    }

    const handleApprove = async (incident) => {
        if (!window.confirm('Approve this incident?')) {
            return
        }
        try {
            await service.approve(incident.sys_id)
            alert('Incident approved and payment request sent to student!')
            onRefresh()
        } catch (error) {
            alert('Failed to approve incident: ' + error.message)
        }
    }

    const handleReject = async (incident) => {
        const reason = window.prompt('Enter rejection reason:')
        if (!reason) return

        try {
            await service.reject(incident.sys_id, reason)
            alert('Incident rejected!')
            onRefresh()
        } catch (error) {
            alert('Failed to reject incident: ' + error.message)
        }
    }

    const handleRecordPayment = async (incident) => {
        const status = window.confirm('Mark as Paid? (OK=Paid, Cancel=Waived)')
        if (status === null) return

        try {
            await service.recordPayment(incident.sys_id, status ? 'Paid' : 'Waived')
            alert('Payment recorded successfully!')
            onRefresh()
        } catch (error) {
            alert('Failed to record payment: ' + error.message)
        }
    }

    return (
        <div className="incident-list">
            {incidents.length === 0 ? (
                <div className="no-incidents">No book incidents found</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Incident #</th>
                            <th>Book Title</th>
                            <th>Student</th>
                            <th>Type</th>
                            <th>Assessment</th>
                            <th>Charge</th>
                            <th>Payment</th>
                            <th>Approval</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map((incident) => (
                            <tr key={incident.sys_id}>
                                <td className="incident-number">{incident.incident_number}</td>
                                <td className="book-title">{incident.book_title}</td>
                                <td className="student-name">{incident.student_name}</td>
                                <td>
                                    <span className="type-badge">
                                        {incident.incident_type}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(incident.assessment_status)}`}>
                                        {incident.assessment_status}
                                    </span>
                                </td>
                                <td className="charge">${parseFloat(incident.total_charge || 0).toFixed(2)}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(incident.payment_status)}`}>
                                        {incident.payment_status}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(incident.approval_status)}`}>
                                        {incident.approval_status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        {incident.assessment_status === 'Pending' && (
                                            <button
                                                className="action-btn assess-btn"
                                                onClick={() => handleAssess(incident)}
                                                title="Assess and calculate fees"
                                            >
                                                Assess
                                            </button>
                                        )}
                                        {incident.assessment_status === 'Assessed' &&
                                            incident.approval_status === 'Pending' && (
                                                <>
                                                    <button
                                                        className="action-btn approve-btn"
                                                        onClick={() => handleApprove(incident)}
                                                        title="Approve incident"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="action-btn reject-btn"
                                                        onClick={() => handleReject(incident)}
                                                        title="Reject incident"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        {incident.approval_status === 'Approved' &&
                                            incident.payment_status === 'Pending' && (
                                                <button
                                                    className="action-btn payment-btn"
                                                    onClick={() => handleRecordPayment(incident)}
                                                    title="Record payment"
                                                >
                                                    Payment
                                                </button>
                                            )}
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => onEdit(incident)}
                                            title="Edit incident"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

