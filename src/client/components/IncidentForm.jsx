import React, { useState, useEffect } from 'react'
import './IncidentForm.css'

export default function IncidentForm({ incident, onSubmit, onCancel, service }) {
    const isEditing = !!incident
    const [estimatedFee, setEstimatedFee] = useState(0)
    const [loading, setLoading] = useState(false)

    // Initialize form state
    const [formData, setFormData] = useState({
        book_title: '',
        book_isbn: '',
        student_name: '',
        student_email: '',
        student_id: '',
        incident_type: 'Damaged',
        incident_date: new Date().toISOString().split('T')[0],
        description: '',
        replacement_cost: '',
        photo_url: '',
    })

    // Load incident data if editing
    useEffect(() => {
        if (incident) {
            setFormData({
                book_title: incident.book_title || '',
                book_isbn: incident.book_isbn || '',
                student_name: incident.student_name || '',
                student_email: incident.student_email || '',
                student_id: incident.student_id || '',
                incident_type: incident.incident_type || 'Damaged',
                incident_date: incident.incident_date || new Date().toISOString().split('T')[0],
                description: incident.description || '',
                replacement_cost: incident.replacement_cost || '',
                photo_url: incident.photo_url || '',
            })
        }
    }, [incident])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))

        // Calculate fee when replacement cost or type changes
        if (name === 'replacement_cost' || name === 'incident_type') {
            const cost = name === 'replacement_cost' ? value : formData.replacement_cost
            const type = name === 'incident_type' ? value : formData.incident_type
            if (cost) {
                calculateFee(cost, type)
            }
        }
    }

    const calculateFee = async (cost, type) => {
        if (!service) return
        try {
            setLoading(true)
            const result = await service.calculateFee(cost, type)
            setEstimatedFee(result.total_charge || 0)
        } catch (error) {
            console.error('Error calculating fee:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.book_title || !formData.student_name || !formData.student_email) {
            alert('Please fill in all required fields')
            return
        }
        onSubmit(formData)
    }

    return (
        <div className="form-overlay">
            <div className="form-container book-incident-form">
                <div className="form-header">
                    <h2>{isEditing ? 'Edit Book Incident' : 'Report Book Incident'}</h2>
                    <button type="button" className="close-button" onClick={onCancel}>
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Student Information */}
                    <fieldset>
                        <legend>Student Information</legend>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="student_name">
                                    Student Name *
                                </label>
                                <input
                                    type="text"
                                    id="student_name"
                                    name="student_name"
                                    value={formData.student_name}
                                    onChange={handleChange}
                                    required
                                    disabled={isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="student_id">
                                    Student ID *
                                </label>
                                <input
                                    type="text"
                                    id="student_id"
                                    name="student_id"
                                    value={formData.student_id}
                                    onChange={handleChange}
                                    required
                                    disabled={isEditing}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="student_email">
                                Student Email *
                            </label>
                            <input
                                type="email"
                                id="student_email"
                                name="student_email"
                                value={formData.student_email}
                                onChange={handleChange}
                                required
                                disabled={isEditing}
                            />
                        </div>
                    </fieldset>

                    {/* Book Information */}
                    <fieldset>
                        <legend>Book Information</legend>
                        <div className="form-group">
                            <label htmlFor="book_title">
                                Book Title *
                            </label>
                            <input
                                type="text"
                                id="book_title"
                                name="book_title"
                                value={formData.book_title}
                                onChange={handleChange}
                                required
                                placeholder="Enter the title of the book"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="book_isbn">
                                    ISBN
                                </label>
                                <input
                                    type="text"
                                    id="book_isbn"
                                    name="book_isbn"
                                    value={formData.book_isbn}
                                    onChange={handleChange}
                                    placeholder="ISBN-13"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="incident_type">
                                    Incident Type *
                                </label>
                                <select
                                    id="incident_type"
                                    name="incident_type"
                                    value={formData.incident_type}
                                    onChange={handleChange}
                                >
                                    <option value="Damaged">Damaged</option>
                                    <option value="Loss">Lost</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    {/* Incident Details */}
                    <fieldset>
                        <legend>Incident Details</legend>
                        <div className="form-group">
                            <label htmlFor="incident_date">
                                Incident Date *
                            </label>
                            <input
                                type="date"
                                id="incident_date"
                                name="incident_date"
                                value={formData.incident_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Describe what happened to the book"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="photo_url">
                                Photo URL (Evidence)
                            </label>
                            <input
                                type="url"
                                id="photo_url"
                                name="photo_url"
                                value={formData.photo_url}
                                onChange={handleChange}
                                placeholder="https://example.com/photo.jpg"
                            />
                        </div>
                    </fieldset>

                    {/* Cost Information */}
                    <fieldset>
                        <legend>Cost Information</legend>
                        <div className="form-group">
                            <label htmlFor="replacement_cost">
                                Replacement Cost ($) *
                            </label>
                            <input
                                type="number"
                                id="replacement_cost"
                                name="replacement_cost"
                                value={formData.replacement_cost}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                            />
                        </div>
                        {estimatedFee > 0 && (
                            <div className="fee-summary">
                                <p>
                                    <strong>Replacement Cost:</strong> $
                                    {parseFloat(formData.replacement_cost || 0).toFixed(2)}
                                </p>
                                <p>
                                    <strong>Fee ({formData.incident_type === 'Loss' ? '100%' : '10%'}):</strong> $
                                    {(estimatedFee - parseFloat(formData.replacement_cost || 0)).toFixed(2)}
                                </p>
                                <p className="total">
                                    <strong>Estimated Total Charge:</strong> ${estimatedFee.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </fieldset>

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Processing...' : isEditing ? 'Update' : 'Submit Incident'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
