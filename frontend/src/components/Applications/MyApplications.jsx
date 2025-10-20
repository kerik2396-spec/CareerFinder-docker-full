import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MyApplications.css';

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyApplications();
    }, []);

    const fetchMyApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/applications/my-applications', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setApplications(response.data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { class: 'status-pending', label: 'Pending' },
            REVIEWED: { class: 'status-reviewed', label: 'Reviewed' },
            ACCEPTED: { class: 'status-accepted', label: 'Accepted' },
            REJECTED: { class: 'status-rejected', label: 'Rejected' }
        };

        const config = statusConfig[status] || { class: 'status-pending', label: status };
        return <span className={`status-badge ${config.class}`}>{config.label}</span>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="loading">Loading your applications...</div>;
    }

    return (
        <div className="my-applications-container">
            <div className="applications-header">
                <h1>My Job Applications</h1>
                <p>Track all your job applications in one place</p>
            </div>

            {applications.length === 0 ? (
                <div className="no-applications">
                    <h3>No applications yet</h3>
                    <p>You haven't applied to any jobs yet. Start browsing vacancies to apply!</p>
                    <Link to="/vacancies" className="browse-btn">
                        Browse Vacancies
                    </Link>
                </div>
            ) : (
                <div className="applications-list">
                    {applications.map(application => (
                        <div key={application.id} className="application-card">
                            <div className="application-main">
                                <div className="application-info">
                                    <h3>
                                        <Link to={`/vacancies/${application.vacancyId}`}>
                                            {application.vacancyTitle}
                                        </Link>
                                    </h3>
                                    <p className="company-name">{application.companyName}</p>
                                    <p className="application-date">
                                        Applied on {formatDate(application.appliedAt)}
                                    </p>
                                    {application.coverLetter && (
                                        <div className="cover-letter-preview">
                                            <strong>Cover Letter:</strong>
                                            <p>{application.coverLetter.substring(0, 150)}...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="application-status">
                                    {getStatusBadge(application.status)}
                                </div>
                            </div>
                            <div className="application-actions">
                                <Link 
                                    to={`/vacancies/${application.vacancyId}`}
                                    className="view-vacancy-btn"
                                >
                                    View Vacancy
                                </Link>
                                <button className="withdraw-btn">
                                    Withdraw Application
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyApplications;