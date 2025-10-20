const express = require('express');
const Vacancy = require('../models/Vacancy');
const Company = require('../models/Company');
const { protect, restrictTo } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Получение всех вакансий (публичный доступ)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Используем статический метод для поиска
    const vacancies = await Vacancy.searchVacancies(req.query)
      .skip(skip)
      .limit(limit)
      .sort({ 
        'boosts.isFeatured': -1,
        'boosts.isUrgent': -1,
        createdAt: -1 
      });

    const total = await Vacancy.countDocuments(Vacancy.searchVacancies(req.query).getQuery());

    res.status(200).json({
      success: true,
      data: {
        vacancies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения вакансий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении вакансий'
    });
  }
});

// Получение одной вакансии
router.get('/:id', async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    
    if (!vacancy || !vacancy.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Вакансия не найдена'
      });
    }

    // Увеличиваем счетчик просмотров
    await vacancy.incrementViews();

    res.status(200).json({
      success: true,
      data: { vacancy }
    });
  } catch (error) {
    console.error('Ошибка получения вакансии:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении вакансии'
    });
  }
});

// Создание вакансии
router.post('/', [
  protect,
  restrictTo('employer'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Название вакансии должно содержать от 5 до 100 символов'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Описание вакансии должно содержать от 50 до 5000 символов'),
  body('requirements.experience')
    .isIn(['no experience', '0-1 year', '1-3 years', '3-5 years', '5+ years'])
    .withMessage('Укажите корректный опыт работы'),
  body('salary.min')
    .isInt({ min: 0 })
    .withMessage('Минимальная зарплата должна быть положительным числом'),
  body('salary.max')
    .isInt({ min: 0 })
    .withMessage('Максимальная зарплата должна быть положительным числом'),
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Город должен содержать от 2 до 50 символов'),
  body('employment.type')
    .isIn(['full-time', 'part-time', 'contract', 'freelance', 'internship'])
    .withMessage('Укажите корректный тип занятости'),
  body('employment.schedule')
    .isIn(['office', 'remote', 'hybrid'])
    .withMessage('Укажите корректный график работы'),
  body('category')
    .isIn([
      'it', 'marketing', 'sales', 'design', 'finance', 
      'hr', 'management', 'support', 'other'
    ])
    .withMessage('Укажите корректную категорию')
], handleValidationErrors, async (req, res) => {
  try {
    // Получаем компанию пользователя
    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('employerProfile.company');
    
    if (!user.employerProfile.company) {
      return res.status(400).json({
        success: false,
        message: 'У вас нет компании для размещения вакансий'
      });
    }

    const vacancyData = {
      ...req.body,
      employer: req.user.id,
      company: user.employerProfile.company._id
    };

    const vacancy = await Vacancy.create(vacancyData);

    // Обновляем статистику компании
    await Company.findByIdAndUpdate(user.employerProfile.company._id, {
      $inc: { 
        'stats.totalVacancies': 1,
        'stats.activeVacancies': 1 
      }
    });

    res.status(201).json({
      success: true,
      data: { vacancy }
    });
  } catch (error) {
    console.error('Ошибка создания вакансии:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании вакансии'
    });
  }
});

// Обновление вакансии
router.patch('/:id', [
  protect,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Название вакансии должно содержать от 5 до 100 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Описание вакансии должно содержать от 50 до 5000 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Вакансия не найдена'
      });
    }

    // Проверяем права доступа
    if (vacancy.employer.toString() !== req.user.id.toString() && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для редактирования этой вакансии'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'requirements', 'salary', 'location',
      'employment', 'category', 'tags', 'status', 'settings'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedVacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      updates,
      { 
        new: true,
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      data: { vacancy: updatedVacancy }
    });
  } catch (error) {
    console.error('Ошибка обновления вакансии:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении вакансии'
    });
  }
});

// Удаление вакансии
router.delete('/:id', protect, async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Вакансия не найдена'
      });
    }

    // Проверяем права доступа
    if (vacancy.employer.toString() !== req.user.id.toString() && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для удаления этой вакансии'
      });
    }

    // Мягкое удаление
    vacancy.isActive = false;
    vacancy.status = 'closed';
    await vacancy.save();

    // Обновляем статистику компании
    await Company.findByIdAndUpdate(vacancy.company, {
      $inc: { 'stats.activeVacancies': -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Вакансия успешно удалена'
    });
  } catch (error) {
    console.error('Ошибка удаления вакансии:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении вакансии'
    });
  }
});

// Получение вакансий пользователя
router.get('/user/my-vacancies', protect, restrictTo('employer'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status } = req.query;
    
    let query = { 
      employer: req.user.id,
      isActive: true 
    };
    
    if (status) {
      query.status = status;
    }

    const vacancies = await Vacancy.find(query)
      .select('title salary location status stats createdAt expiresAt boosts')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Vacancy.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        vacancies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения вакансий пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении вакансий'
    });
  }
});

// Обновление статуса вакансии
router.patch('/:id/status', [
  protect,
  body('status')
    .isIn(['active', 'paused', 'closed', 'draft'])
    .withMessage('Укажите корректный статус')
], handleValidationErrors, async (req, res) => {
  try {
    const { status } = req.body;

    const vacancy = await Vacancy.findById(req.params.id);
    
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Вакансия не найдена'
      });
    }

    // Проверяем права доступа
    if (vacancy.employer.toString() !== req.user.id.toString() && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для изменения статуса этой вакансии'
      });
    }

    vacancy.status = status;
    
    // Обновляем статистику компании при изменении активности
    if (status === 'active' && vacancy.status !== 'active') {
      await Company.findByIdAndUpdate(vacancy.company, {
        $inc: { 'stats.activeVacancies': 1 }
      });
    } else if (status !== 'active' && vacancy.status === 'active') {
      await Company.findByIdAndUpdate(vacancy.company, {
        $inc: { 'stats.activeVacancies': -1 }
      });
    }

    await vacancy.save();

    res.status(200).json({
      success: true,
      data: { vacancy },
      message: 'Статус вакансии обновлен'
    });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении статуса вакансии'
    });
  }
});

// Буст вакансии
router.post('/:id/boost', [
  protect,
  body('type')
    .isIn(['highlight', 'urgent', 'feature'])
    .withMessage('Укажите корректный тип буста'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Длительность должна быть от 1 до 30 дней')
], handleValidationErrors, async (req, res) => {
  try {
    const { type, duration = 7 } = req.body;

    const vacancy = await Vacancy.findById(req.params.id);
    
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Вакансия не найдена'
      });
    }

    // Проверяем права доступа
    if (vacancy.employer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для буста этой вакансии'
      });
    }

    await vacancy.boost(type, duration);

    res.status(200).json({
      success: true,
      data: { vacancy },
      message: 'Вакансия успешно усилена'
    });
  } catch (error) {
    console.error('Ошибка буста вакансии:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при усилении вакансии'
    });
  }
});

// Обновление статистики просмотров
router.post('/:id/view', async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    
    if (!vacancy || !vacancy.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Вакансия не найдена'
      });
    }

    await vacancy.incrementViews();

    res.status(200).json({
      success: true,
      message: 'Статистика обновлена'
    });
  } catch (error) {
    console.error('Ошибка обновления статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении статистики'
    });
  }
});

module.exports = router;