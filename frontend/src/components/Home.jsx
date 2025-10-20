import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const [vacanciesCount, setVacanciesCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchVacanciesCount();
    }, []);

    const fetchVacanciesCount = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/vacancies/stats/count');
            setVacanciesCount(response.data);
        } catch (error) {
            console.error('Error fetching vacancies count:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/vacancies?search=${encodeURIComponent(searchQuery)}`;
        }
    };

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Find Your Dream Job</h1>
                    <p>Discover the latest job openings and boost your career with CareerFinder</p>
                    <form onSubmit={handleSearch} className="hero-search">
                        <input
                            type="text"
                            placeholder="Job title, company, or keywords"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit">Search Jobs</button>
                    </form>
                    <div className="hero-stats">
                        <div className="stat">
                            <strong>{vacanciesCount}+</strong>
                            <span>Active Vacancies</span>
                        </div>
                        <div className="stat">
                            <strong>100+</strong>
                            <span>Companies</span>
                        </div>
                        <div className="stat">
                            <strong>1K+</strong>
                            <span>Job Seekers</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2>Why Choose CareerFinder?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🚀</div>
                            <h3>Fast & Easy</h3>
                            <p>Quick and easy job search with advanced filters and instant applications</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💼</div>
                            <h3>For Employers</h3>
                            <p>Post vacancies and find the perfect candidates for your company</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>Secure</h3>
                            <p>Your data is protected with modern security practices</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Start Your Journey?</h2>
                        <p>Join thousands of job seekers and employers today</p>
                        <div className="cta-buttons">
                            <Link to="/register" className="cta-btn primary">Sign Up Now</Link>
                            <Link to="/vacancies" className="cta-btn secondary">Browse Jobs</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Categories */}
            <section className="categories-section">
                <div className="container">
                    <h2>Popular Categories</h2>
                    <div className="categories-grid">
                        <div className="category-card">
                            <h4>Technology</h4>
                            <p>Software development, IT, and tech roles</p>
                        </div>
                        <div className="category-card">
                            <h4>Marketing</h4>
                            <p>Digital marketing, SEO, and advertising</p>
                        </div>
                        <div className="category-card">
                            <h4>Design</h4>
                            <p>UI/UX, graphic design, and creative roles</p>
                        </div>
                        <div className="category-card">
                            <h4>Business</h4>
                            <p>Management, sales, and operations</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;