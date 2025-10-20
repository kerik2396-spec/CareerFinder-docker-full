import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import VacancyList from './components/Vacancies/VacancyList';
import VacancyDetail from './components/Vacancies/VacancyDetail';
import CreateVacancy from './components/Vacancies/CreateVacancy';
import MyApplications from './components/Applications/MyApplications';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/vacancies" element={<VacancyList />} />
            <Route path="/vacancies/:id" element={<VacancyDetail />} />
            
            {/* Protected Routes - For Authenticated Users */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <div className="profile-page">
                    <h2>User Profile</h2>
                    <p>Profile management coming soon...</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-applications" 
              element={
                <ProtectedRoute>
                  <MyApplications />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes - For Employers & Admins */}
            <Route 
              path="/vacancies/create" 
              element={
                <ProtectedRoute requiredRole="ROLE_EMPLOYER">
                  <CreateVacancy />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/employer/dashboard" 
              element={
                <ProtectedRoute requiredRole="ROLE_EMPLOYER">
                  <div className="employer-dashboard">
                    <h2>Employer Dashboard</h2>
                    <div className="dashboard-stats">
                      <div className="stat-card">
                        <h3>Active Vacancies</h3>
                        <p className="stat-number">0</p>
                      </div>
                      <div className="stat-card">
                        <h3>Total Applications</h3>
                        <p className="stat-number">0</p>
                      </div>
                      <div className="stat-card">
                        <h3>Pending Reviews</h3>
                        <p className="stat-number">0</p>
                      </div>
                    </div>
                    <p>Employer dashboard features coming soon...</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes - For Admins Only */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <div className="admin-panel">
                    <h2>Admin Panel</h2>
                    <p>Admin features coming soon...</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            {/* 404 Page */}
            <Route path="*" element={
              <div className="not-found">
                <div className="not-found-content">
                  <h1>404</h1>
                  <h2>Page Not Found</h2>
                  <p>The page you're looking for doesn't exist.</p>
                  <a href="/" className="home-link">Go Back Home</a>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;