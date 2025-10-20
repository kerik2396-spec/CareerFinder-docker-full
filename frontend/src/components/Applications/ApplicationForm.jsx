import React, { useState } from 'react';
import axios from 'axios';
import './ApplicationForm.css';

const ApplicationForm = ({ vacancy, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        coverLetter: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.coverLetter.trim()) {
            setErrors({ coverLetter: 'Cover letter is required' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8080/api/applications', {
                vacancyId: vacancy.id,
                coverLetter: formData.coverLetter
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error submitting application:', error);
            setErrors({ submit: error.response?.data || 'Failed to submit application' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="application-form-overlay">
            <div className="application-form-modal">
                <div className="modal-header">
                    <h2>Apply for {vacancy.title}</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="modal-body">
                    <div className="vacancy-preview">
                        <h4>{vacancy.companyName}</h4>
                        <p>{vacancy.title} • {vacancy.location}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="application-form">
                        <div className="form-group">
                            <label htmlFor="coverLetter">
                                Cover Letter *
                                <span className="help-text">Tell why you're a good fit for this position</span>
                            </label>
                            <textarea
                                id="coverLetter"
                                value={formData.coverLetter}
                                onChange={(e) => setFormData({ coverLetter: e.target.value })}
                                placeholder="Describe your experience, skills, and why you're interested in this position..."
                                rows="8"
                                className={errors.coverLetter ? 'error' : ''}
                            />
                            {errors.coverLetter && (
                                <span className="error-text">{errors.coverLetter}</span>
                            )}
                        </div>

                        {errors.submit && (
                            <div className="error-message">{errors.submit}</div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplicationForm;