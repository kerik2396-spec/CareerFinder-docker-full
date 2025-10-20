import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VacancyDetail.css';

const VacancyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vacancy, setVacancy] = useState(null);
    const [similarVacancies, setSimilarVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [application, setApplication] = useState({
        coverLetter: '',
        resume: ''
    });

    useEffect(() => {
        fetchVacancyDetail();
    }, [id]);

    const fetchVacancyDetail = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/vacancies/${id}/detailed`);
            setVacancy(response.data.vacancy);
            setSimilarVacancies(response.data.similarVacancies || []);
        } catch (error) {
            console.error('Error fetching vacancy details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setApplying(true);
        try {
            // Здесь будет логика отправки отклика
            alert('Application submitted successfully!');
        } catch (error) {
            console.error('Error applying:', error);
            alert('Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="loading">Loading vacancy details...</div>;
    }

    if (!vacancy) {
        return (
            <div className="not-found">
                <h2>Vacancy Not Found</h2>
                <p>The vacancy you're looking for doesn't exist or has been removed.</p>
                <Link to="/vacancies" className="back-link">Back to Vacancies</Link>
            </div>
        );
    }

    return (
        <div className="vacancy-detail-container">
            <div className="vacancy-detail-content">
                {/* Header Section */}
                <div className="vacancy-header">
                    <div className="back-nav">
                        <Link to="/vacancies" className="back-link">
                            ← Back to Vacancies
                        </Link>
                    </div>
                    
                    <div className="vacancy-title-section">
                        <h1>{vacancy.title}</h1>
                        <div className="company-info">
                            {vacancy.companyLogo && (
                                <img src={vacancy.companyLogo} alt={vacancy.companyName} className="company-logo" />
                            )}
                            <div className="company-details">
                                <h2>{vacancy.companyName}</h2>
                                <div className="company-meta">
                                    <span>📍 {vacancy.location}</span>
                                    <span>👥 50-200 employees</span>
                                    <span>🏢 Information Technology</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="vacancy-meta">
                        <div className="meta-item">
                            <span className="meta-label">💼 Employment Type</span>
                            <span className="meta-value">{vacancy.employmentType.replace('_', ' ')}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">⚡ Experience Level</span>
                            <span className="meta-value">{vacancy.experienceLevel}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">💰 Salary</span>
                            <span className="meta-value">{vacancy.salary || 'Not specified'}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">📅 Posted</span>
                            <span className="meta-value">{formatDate(vacancy.createdAt)}</span>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button 
                            onClick={handleApply}
                            disabled={applying}
                            className="apply-btn primary"
                        >
                            {applying ? 'Applying...' : 'Apply Now'}
                        </button>
                        <button className="save-btn secondary">
                            💖 Save for Later
                        </button>
                        <button className="share-btn secondary">
                            📤 Share
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="vacancy-body">
                    <div className="main-content">
                        {/* Job Description */}
                        <section className="description-section">
                            <h3>Job Description</h3>
                            <div className="description-content">
                                {vacancy.description.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </section>

                        {/* Requirements */}
                        {vacancy.skills && (
                            <section className="skills-section">
                                <h3>Required Skills</h3>
                                <div className="skills-list">
                                    {vacancy.skills.split(',').map((skill, index) => (
                                        <span key={index} className="skill-tag">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Company Info */}
                        <section className="company-section">
                            <h3>About {vacancy.companyName}</h3>
                            <p>
                                {vacancy.companyName} is a leading company in their industry, 
                                committed to innovation and excellence. They offer a dynamic 
                                work environment and opportunities for professional growth.
                            </p>
                            <div className="company-links">
                                {vacancy.website && (
                                    <a href={vacancy.website} target="_blank" rel="noopener noreferrer">
                                        🌐 Company Website
                                    </a>
                                )}
                                <a href={`mailto:${vacancy.contactEmail}`}>
                                    📧 Contact: {vacancy.contactEmail}
                                </a>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="sidebar">
                        {/* Quick Facts */}
                        <div className="quick-facts">
                            <h4>Job Overview</h4>
                            <div className="fact-item">
                                <span className="fact-label">📍 Location</span>
                                <span className="fact-value">{vacancy.location}</span>
                            </div>
                            <div className="fact-item">
                                <span className="fact-label">💼 Type</span>
                                <span className="fact-value">{vacancy.employmentType.replace('_', ' ')}</span>
                            </div>
                            <div className="fact-item">
                                <span className="fact-label">⚡ Level</span>
                                <span className="fact-value">{vacancy.experienceLevel}</span>
                            </div>
                            <div className="fact-item">
                                <span className="fact-label">💰 Salary</span>
                                <span className="fact-value">{vacancy.salary || 'Not specified'}</span>
                            </div>
                            <div className="fact-item">
                                <span className="fact-label">📅 Posted</span>
                                <span className="fact-value">{formatDate(vacancy.createdAt)}</span>
                            </div>
                        </div>

                        {/* Similar Jobs */}
                        {similarVacancies.length > 0 && (
                            <div className="similar-jobs">
                                <h4>Similar Jobs</h4>
                                {similarVacancies.map(similar => (
                                    <div key={similar.id} className="similar-job">
                                        <h5>
                                            <Link to={`/vacancies/${similar.id}`}>
                                                {similar.title}
                                            </Link>
                                        </h5>
                                        <p className="similar-company">{similar.companyName}</p>
                                        <p className="similar-location">{similar.location}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VacancyDetail;