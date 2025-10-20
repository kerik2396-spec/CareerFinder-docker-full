import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './VacancyList.css';

const VacancyList = () => {
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        location: '',
        employmentType: '',
        experienceLevel: ''
    });

    useEffect(() => {
        fetchVacancies();
    }, []);

    const fetchVacancies = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/vacancies');
            setVacancies(response.data);
        } catch (error) {
            console.error('Error fetching vacancies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchVacancies();
            return;
        }

        try {
            const response = await axios.get(`http://localhost:8080/api/vacancies/search?query=${searchQuery}`);
            setVacancies(response.data);
        } catch (error) {
            console.error('Error searching vacancies:', error);
        }
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = { ...filters, [filterType]: value };
        setFilters(newFilters);
        applyFilters(newFilters);
    };

    const applyFilters = async (filters) => {
        const params = new URLSearchParams();
        
        if (filters.location) params.append('location', filters.location);
        if (filters.employmentType) params.append('employmentType', filters.employmentType);
        if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);

        try {
            const response = await axios.get(`http://localhost:8080/api/vacancies/filter?${params}`);
            setVacancies(response.data);
        } catch (error) {
            console.error('Error filtering vacancies:', error);
        }
    };

    const clearFilters = () => {
        setFilters({ location: '', employmentType: '', experienceLevel: '' });
        setSearchQuery('');
        fetchVacancies();
    };

    if (loading) {
        return <div className="loading">Loading vacancies...</div>;
    }

    return (
        <div className="vacancy-list-container">
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search for jobs, companies, skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-btn">Search</button>
                </form>
            </div>

            <div className="filters-section">
                <select 
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Locations</option>
                    <option value="Moscow">Moscow</option>
                    <option value="Saint Petersburg">Saint Petersburg</option>
                    <option value="Remote">Remote</option>
                </select>

                <select 
                    value={filters.employmentType}
                    onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Employment Types</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="REMOTE">Remote</option>
                    <option value="CONTRACT">Contract</option>
                </select>

                <select 
                    value={filters.experienceLevel}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Experience Levels</option>
                    <option value="INTERN">Intern</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="MIDDLE">Middle</option>
                    <option value="SENIOR">Senior</option>
                </select>

                <button onClick={clearFilters} className="clear-filters-btn">
                    Clear Filters
                </button>
            </div>

            <div className="vacancies-grid">
                {vacancies.length === 0 ? (
                    <div className="no-vacancies">
                        <h3>No vacancies found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    vacancies.map(vacancy => (
                        <div key={vacancy.id} className="vacancy-card">
                            <div className="vacancy-header">
                                <h3 className="vacancy-title">{vacancy.title}</h3>
                                <span className="company-name">{vacancy.companyName}</span>
                            </div>
                            
                            <div className="vacancy-details">
                                <div className="detail-item">
                                    <span className="detail-label">📍</span>
                                    {vacancy.location}
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">💰</span>
                                    {vacancy.salary || 'Salary not specified'}
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">⚡</span>
                                    {vacancy.experienceLevel}
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">🕒</span>
                                    {vacancy.employmentType}
                                </div>
                            </div>

                            <div className="skills-section">
                                <strong>Skills: </strong>
                                {vacancy.skills || 'Not specified'}
                            </div>

                            <div className="vacancy-actions">
                                <Link to={`/vacancies/${vacancy.id}`} className="view-details-btn">
                                    View Details
                                </Link>
                                <button className="apply-btn">
                                    Apply Now
                                </button>
                            </div>

                            <div className="vacancy-footer">
                                <span className="post-date">
                                    Posted {new Date(vacancy.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VacancyList;