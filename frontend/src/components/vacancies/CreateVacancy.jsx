import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateVacancy.css';

const CreateVacancy = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        companyName: '',
        companyLogo: '',
        location: '',
        salary: '',
        employmentType: '',
        experienceLevel: '',
        skills: '',
        contactEmail: '',
        website: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
        if (!formData.experienceLevel) newErrors.experienceLevel = 'Experience level is required';
        if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = 'Contact email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
            newErrors.contactEmail = 'Email is invalid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8080/api/vacancies', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                alert('Vacancy created successfully!');
                navigate('/vacancies');
            }
        } catch (error) {
            console.error('Error creating vacancy:', error);
            if (error.response?.data) {
                setErrors({ submit: error.response.data });
            } else {
                setErrors({ submit: 'Failed to create vacancy. Please try again.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="create-vacancy-container">
            <div className="create-vacancy-card">
                <h2>Create New Vacancy</h2>
                <p className="subtitle">Post a new job opening</p>
                
                <form onSubmit={handleSubmit} className="vacancy-form">
                    <div className="form-group">
                        <label htmlFor="title">Job Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={errors.title ? 'error' : ''}
                            placeholder="e.g. Senior Java Developer"
                        />
                        {errors.title && <span className="error-text">{errors.title}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Job Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={errors.description ? 'error' : ''}
                            placeholder="Describe the job responsibilities, requirements, etc."
                            rows="6"
                        />
                        {errors.description && <span className="error-text">{errors.description}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="companyName">Company Name *</label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className={errors.companyName ? 'error' : ''}
                                placeholder="Your company name"
                            />
                            {errors.companyName && <span className="error-text">{errors.companyName}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Location *</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className={errors.location ? 'error' : ''}
                                placeholder="e.g. Moscow, Remote"
                            />
                            {errors.location && <span className="error-text">{errors.location}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="employmentType">Employment Type *</label>
                            <select
                                id="employmentType"
                                name="employmentType"
                                value={formData.employmentType}
                                onChange={handleChange}
                                className={errors.employmentType ? 'error' : ''}
                            >
                                <option value="">Select Type</option>
                                <option value="FULL_TIME">Full Time</option>
                                <option value="PART_TIME">Part Time</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="INTERNSHIP">Internship</option>
                                <option value="REMOTE">Remote</option>
                            </select>
                            {errors.employmentType && <span className="error-text">{errors.employmentType}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="experienceLevel">Experience Level *</label>
                            <select
                                id="experienceLevel"
                                name="experienceLevel"
                                value={formData.experienceLevel}
                                onChange={handleChange}
                                className={errors.experienceLevel ? 'error' : ''}
                            >
                                <option value="">Select Level</option>
                                <option value="INTERN">Intern</option>
                                <option value="JUNIOR">Junior</option>
                                <option value="MIDDLE">Middle</option>
                                <option value="SENIOR">Senior</option>
                                <option value="LEAD">Lead</option>
                            </select>
                            {errors.experienceLevel && <span className="error-text">{errors.experienceLevel}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="salary">Salary</label>
                        <input
                            type="text"
                            id="salary"
                            name="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            placeholder="e.g. 50000-80000, до 100000"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="skills">Required Skills</label>
                        <input
                            type="text"
                            id="skills"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="e.g. Java, Spring Boot, SQL, Docker"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="contactEmail">Contact Email *</label>
                            <input
                                type="email"
                                id="contactEmail"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                className={errors.contactEmail ? 'error' : ''}
                                placeholder="contact@company.com"
                            />
                            {errors.contactEmail && <span className="error-text">{errors.contactEmail}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="website">Website</label>
                            <input
                                type="url"
                                id="website"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://company.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="companyLogo">Company Logo URL (optional)</label>
                        <input
                            type="url"
                            id="companyLogo"
                            name="companyLogo"
                            value={formData.companyLogo}
                            onChange={handleChange}
                            placeholder="https://company.com/logo.png"
                        />
                    </div>

                    {errors.submit && <div className="error-message">{errors.submit}</div>}

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="create-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create Vacancy'}
                        </button>
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={() => navigate('/vacancies')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateVacancy;