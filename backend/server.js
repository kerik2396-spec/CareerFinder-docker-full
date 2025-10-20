const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock данные для тестирования
const users = [];
const vacancies = [
  {
    id: 1,
    title: "Frontend Developer",
    companyName: "Tech Company",
    location: "Moscow",
    salary: "100000-150000",
    employmentType: "FULL_TIME",
    experienceLevel: "MIDDLE",
    description: "We are looking for a skilled Frontend Developer...",
    skills: "JavaScript, React, HTML, CSS",
    contactEmail: "hr@techcompany.com",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Backend Developer", 
    companyName: "Startup Inc",
    location: "Remote",
    salary: "120000-180000",
    employmentType: "REMOTE",
    experienceLevel: "SENIOR",
    description: "Join our backend team to build amazing APIs...",
    skills: "Java, Spring Boot, PostgreSQL",
    contactEmail: "jobs@startup.com",
    createdAt: new Date().toISOString()
  }
];

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const user = { id: users.length + 1, email, firstName, lastName };
  users.push(user);
  res.json({ message: "User registered successfully" });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ 
    token: "mock-jwt-token", 
    email: email,
    role: "ROLE_USER"
  });
});

// Vacancies endpoints
app.get('/api/vacancies', (req, res) => {
  res.json(vacancies);
});

app.get('/api/vacancies/:id', (req, res) => {
  const vacancy = vacancies.find(v => v.id === parseInt(req.params.id));
  if (vacancy) {
    res.json(vacancy);
  } else {
    res.status(404).json({ message: "Vacancy not found" });
  }
});

app.get('/api/vacancies/stats/count', (req, res) => {
  res.json(vacancies.length);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});