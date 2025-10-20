const express = require('express');
const Company = require('../models/Company');
const Vacancy = require('../models/Vacancy');
const { protect, restrictTo } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Получение всех компаний (публичный доступ)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { industry, size, location, search, verified } = req.query;
    
    let query = { isActive: true };
    
    if (industry) query.industry = industry;
    if (size) query.size = size;
    if (location) query['contact.address.city'] = new RegExp(location, 'i');
    if (verified === 'true') query['verification.isVerified'] = true;
    
    if (search) {
      query.$text = { $search: search };
    }

    const companies = await Company.find(query)
      .select('name logo industry size description contact verification stats')
      .skip(skip)
      .limit(limit)
      .sort({ 
        'verification.isVerified': -1,
        'stats.totalVacancies': -1,
        createdAt: -1 
      });

    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения компаний:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении компаний'
    });
  }
});

// Получение одной компании
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company || !company.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Компания не найдена'
      });
    }

    // Увеличение счетчика просмотров
    await company.incrementViews();

    // Получение активных вакансий компании
    const activeVacancies = await Vacancy.find({
      company: company._id,
      status: 'active',
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).select('title salary location employment type createdAt stats');

    res.status(200).json({
      success: true,
      data: {
        company: {
          ...company.toObject(),
          activeVacancies
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения компании:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении компании'
    });
  }
});

// Создание компании (только для работодателей)
router.post('/', [
  protect,
  restrictTo('employer'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Название компании должно содержать от 2 до 100 символов'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Описание компании должно содержать от 50 до 2000 символов'),
  body('industry')
    .isIn([
      'it', 'finance', 'healthcare', 'education', 'retail', 
      'manufacturing', 'transportation', 'construction', 
      'entertainment', 'telecom', 'energy', 'other'
    ])
    .withMessage('Укажите корректную отрасль'),
  body('size')
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Укажите корректный размер компании'),
  body('contact.email')
    .isEmail()
    .withMessage('Укажите корректный email компании'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Укажите корректный URL сайта')
], handleValidationErrors, async (req, res) => {
  try {
    // Проверяем, есть ли у пользователя уже компания
    const existingCompany = await Company.findOne({ createdBy: req.user.id });
    
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'У вас уже есть созданная компания'
      });
    }

    const companyData = {
      ...req.body,
      createdBy: req.user.id
    };

    const company = await Company.create(companyData);

    // Обновляем профиль пользователя
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      'employerProfile.company': company._id
    });

    res.status(201).json({
      success: true,
      data: { company }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Компания с таким названием уже существует'
      });
    }
    
    console.error('Ошибка создания компании:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании компании'
    });
  }
});

// Обновление компании
router.patch('/:id', [
  protect,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Название компании должно содержать от 2 до 100 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Описание компании должно содержать от 50 до 2000 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Компания не найдена'
      });
    }

    // Проверяем, является ли пользователь владельцем компании
    if (company.createdBy.toString() !== req.user.id.toString() && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для редактирования этой компании'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'logo', 'coverImage', 'industry', 'size',
      'website', 'contact', 'social', 'culture', 'settings'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      updates,
      { 
        new: true,
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      data: { company: updatedCompany }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Компания с таким названием уже существует'
      });
    }
    
    console.error('Ошибка обновления компании:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении компании'
    });
  }
});

// Получение компаний пользователя
router.get('/user/my-companies', protect, async (req, res) => {
  try {
    const companies = await Company.find({ createdBy: req.user.id })
      .select('name logo industry size verification stats createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { companies }
    });
  } catch (error) {
    console.error('Ошибка получения компаний пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении компаний'
    });
  }
});

// Верификация компании (админ)
router.patch('/:id/verify', [
  protect,
  restrictTo('admin')
], async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Компания не найдена'
      });
    }

    await company.verify(req.user.id);

    res.status(200).json({
      success: true,
      data: { company },
      message: 'Компания успешно верифицирована'
    });
  } catch (error) {
    console.error('Ошибка верификации компании:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при верификации компании'
    });
  }
});

// Загрузка документов для верификации
router.post('/:id/documents', [
  protect
], async (req, res) => {
  try {
    const { documents } = req.body;
    
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Компания не найдена'
      });
    }

    // Проверяем права доступа
    if (company.createdBy.toString() !== req.user.id.toString() && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для загрузки документов'
      });
    }

    const newDocuments = documents.map(doc => ({
      ...doc,
      uploadedAt: new Date()
    }));

    company.verification.documents.push(...newDocuments);
    await company.save();

    res.status(200).json({
      success: true,
      data: { 
        documents: company.verification.documents 
      }
    });
  } catch (error) {
    console.error('Ошибка загрузки документов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке документов'
    });
  }
});

// Получение статистики компании
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Компания не найдена'
      });
    }

    // Проверяем права доступа
    if (company.createdBy.toString() !== req.user.id.toString() && req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для просмотра статистики'
      });
    }

    // Обновляем статистику
    await company.updateStats();

    res.status(200).json({
      success: true,
      data: { 
        stats: company.stats 
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики'
    });
  }
});

module.exports = router;