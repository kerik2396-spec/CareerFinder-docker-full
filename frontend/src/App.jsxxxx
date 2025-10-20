import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import VacanciesPage from './pages/VacanciesPage'
import ProfilePage from './pages/ProfilePage'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className=\"app\">
          <Header />
          <main className=\"main-content\">
            <Routes>
              <Route path=\"/\" element={<Home />} />
              <Route path=\"/login\" element={<LoginPage />} />
              <Route path=\"/vacancies\" element={<VacanciesPage />} />
              <Route path=\"/profile\" element={<ProfilePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
