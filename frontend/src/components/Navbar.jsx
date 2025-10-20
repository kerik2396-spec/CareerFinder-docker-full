import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    CareerFinder
                </Link>
                
                <div className="nav-menu">
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/vacancies" className={`nav-link ${location.pathname === '/vacancies' ? 'active' : ''}`}>
                        Vacancies
                    </Link>
                    
                    {user ? (
                        <div className="nav-user">
                            {(user.role === 'ROLE_EMPLOYER' || user.role === 'ROLE_ADMIN') && (
                                <Link 
                                    to="/vacancies/create" 
                                    className="nav-link employer-feature"
                                >
                                    Post Job
                                </Link>
                            )}
                            
                            {user.role === 'ROLE_EMPLOYER' && (
                                <Link 
                                    to="/employer/dashboard" 
                                    className="nav-link"
                                >
                                    Dashboard
                                </Link>
                            )}
                            
                            <div className="user-dropdown">
                                <span className="user-greeting">
                                    Hello, {user.email.split('@')[0]}
                                </span>
                                <div className="dropdown-content">
                                    <Link to="/profile" className="dropdown-link">
                                        Profile
                                    </Link>
                                    <button onClick={handleLogout} className="dropdown-link logout">
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="nav-auth">
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link signup">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;