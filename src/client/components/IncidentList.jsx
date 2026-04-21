import React from 'react'
import './IncidentList.css'

export default function IncidentList({ incidents, onEdit, onRefresh, onAction, service, userRole }) {
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

    const handleDelete = async (incident) => {
        if (!window.confirm(`Are you sure you want to delete incident #${incident.incident_number}? This action cannot be undone.`)) {
            return
        }
        try {
            await service.delete(incident.sys_id)
            alert('Incident deleted successfully!')
            if (onRefresh) await onRefresh()
        } catch (error) {
            alert('Failed to delete incident: ' + error.message)
        }
    }

    const handleAssess = async (incident) => {
        if (!window.confirm('Assess this incident and calculate fees?')) {
            return
        }
        try {
            console.log(`Assessing incident: ${incident.sys_id}`);
            const result = await service.assess(incident.sys_id)
            console.log('Assess result:', result);
            alert(`Incident assessed successfully! Charge: $${result.total_charge?.toFixed(2) || 'calculated'}`)
            if (onRefresh) {
                await onRefresh()
                console.log('Incidents refreshed after assess');
            }
        } catch (error) {
            console.error('Error in handleAssess:', error);
            alert('Failed to assess incident: ' + error.message)
        }
    }

    const handleApprove = async (incident) => {
        if (!window.confirm('Approve this incident? This will notify the student for payment.')) {
            return
        }
        try {
            console.log(`Approving incident: ${incident.sys_id}`);
            await service.approve(incident.sys_id)
            alert('Incident approved! Payment notification sent to student.')
            if (onRefresh) {
                await onRefresh()
                console.log('Incidents refreshed after approve');
            }
        } catch (error) {
            console.error('Error in handleApprove:', error);
            alert('Failed to approve incident: ' + error.message)
        }
    }

    const handleReject = async (incident) => {
        const reason = window.prompt('Enter rejection reason:')
        if (!reason) return

        try {
            console.log(`Rejecting incident: ${incident.sys_id}`);
            await service.reject(incident.sys_id, reason)
            alert('Incident rejected!')
            if (onRefresh) {
                await onRefresh()
                console.log('Incidents refreshed after reject');
            }
        } catch (error) {
            console.error('Error in handleReject:', error);
            alert('Failed to reject incident: ' + error.message)
        }
    }

    const handleRecordPayment = async (incident) => {
        const status = window.confirm('Mark as Paid? (OK=Paid, Cancel=Waived)')
        if (status === null) return

        try {
            const paymentStatus = status ? 'Paid' : 'Waived'
            console.log(`Recording payment as ${paymentStatus} for incident: ${incident.sys_id}`);
            await service.recordPayment(incident.sys_id, paymentStatus)
            alert(`Payment recorded as ${paymentStatus}!`)
            if (onRefresh) {
                await onRefresh()
                console.log('Incidents refreshed after payment');
            }
        } catch (error) {
            console.error('Error in handleRecordPayment:', error);
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
                                        {incident.incident_type ? String(incident.incident_type).charAt(0).toUpperCase() + String(incident.incident_type).slice(1) : ''}
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
                                        {/* Assessment actions - Manager/Librarian/Admin only */}
                                        {['manager', 'librarian', 'admin'].includes(userRole) && (incident.assessment_status || '').toLowerCase() === 'pending' && (
                                            <button
                                                className="action-btn assess-btn"
                                                onClick={() => handleAssess(incident)}
                                                title="Assess and calculate fees"
                                            >
                                                Assess
                                            </button>
                                        )}
                                        {/* Approval actions - Manager/Librarian/Admin only */}
                                        {['manager', 'librarian', 'admin'].includes(userRole) && (incident.assessment_status || '').toLowerCase() === 'assessed' &&
                                            (incident.approval_status || '').toLowerCase() === 'pending' && (
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
                                        {/* Payment actions - Manager/Librarian/Admin only */}
                                        {['manager', 'librarian', 'admin'].includes(userRole) && (incident.approval_status || '').toLowerCase() === 'approved' &&
                                            (incident.payment_status || '').toLowerCase() === 'pending' && (
                                                <button
                                                    className="action-btn payment-btn"
                                                    onClick={() => handleRecordPayment(incident)}
                                                    title="Record payment"
                                                >
                                                    Payment
                                                </button>
                                            )}
                                        {/* Edit - Students for own incidents, Admins for any */}
                                        {(userRole === 'student' || userRole === 'admin') && (
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => onEdit(incident)}
                                                title="Edit incident"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {/* Delete - Admin only */}
                                        {userRole === 'admin' && (
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={() => handleDelete(incident)}
                                                title="Delete incident"
                                            >
                                                Delete
                                            </button>
                                        )}
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

