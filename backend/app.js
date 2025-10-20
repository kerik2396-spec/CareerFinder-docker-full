const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/careerfinder', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Мидлвары
app.use(cors());
app.use(express.json());

// Роуты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vacancies', require('./routes/vacancies'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/payments', require('./routes/payments'));

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так!' });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

module.exports = app;
// Добавьте новые маршруты в App.js
import VacancyList from './components/Vacancies/VacancyList';
import CreateVacancy from './components/Vacancies/CreateVacancy';

// В компоненте Routes добавьте:
<Route path="/vacancies" element={<VacancyList />} />
<Route 
    path="/vacancies/create" 
    element={
        <ProtectedRoute>
            <CreateVacancy />
        </ProtectedRoute>
    } 
/>