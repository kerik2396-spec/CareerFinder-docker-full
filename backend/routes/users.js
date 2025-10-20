const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect, restrictTo } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Получение профиля текущего пользователя
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('employerProfile.company')
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении профиля'
    });
  }
});

// Обновление профиля пользователя
router.patch('/profile', [
  protect,
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Имя должно содержать от 1 до 50 символов'),
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Фамилия должна содержать от 1 до 50 символов'),
  body('profile.phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Неверный формат телефона'),
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Биография не может превышать 500 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const allowedUpdates = [
      'profile.firstName',
      'profile.lastName', 
      'profile.phone',
      'profile.bio',
      'profile.location',
      'preferences'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { 
        new: true,
        runValidators: true 
      }
    ).select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении профиля'
    });
  }
});

// Обновление профиля кандидата
router.patch('/candidate-profile', [
  protect,
  restrictTo('candidate'),
  body('candidateProfile.profession')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Профессия не может превышать 100 символов'),
  body('candidateProfile.expectedSalary.min')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Минимальная зарплата должна быть положительным числом'),
  body('candidateProfile.expectedSalary.max')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Максимальная зарплата должна быть положительным числом')
], handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        candidateProfile: req.body.candidateProfile,
        'stats.lastActive': new Date()
      },
      { 
        new: true,
        runValidators: true 
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Ошибка обновления профиля кандидата:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении профиля кандидата'
    });
  }
});

// Добавление навыков кандидату
router.post('/skills', [
  protect,
  restrictTo('candidate'),
  body('skills')
    .isArray({ min: 1 })
    .withMessage('Навыки должны быть массивом'),
  body('skills.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Каждый навык должен содержать от 1 до 50 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const { skills } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Добавляем только уникальные навыки
    const newSkills = skills.filter(skill => 
      !user.candidateProfile.skills.includes(skill.toLowerCase())
    );
    
    user.candidateProfile.skills.push(...newSkills.map(skill => skill.toLowerCase()));
    user.stats.lastActive = new Date();
    
    await user.save();

    res.status(200).json({
      success: true,
      data: { 
        skills: user.candidateProfile.skills,
        added: newSkills.length
      }
    });
  } catch (error) {
    console.error('Ошибка добавления навыков:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при добавлении навыков'
    });
  }
});

// Удаление навыка
router.delete('/skills/:skill', protect, restrictTo('candidate'), async (req, res) => {
  try {
    const { skill } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    user.candidateProfile.skills = user.candidateProfile.skills.filter(
      s => s !== skill.toLowerCase()
    );
    
    user.stats.lastActive = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      data: { skills: user.candidateProfile.skills }
    });
  } catch (error) {
    console.error('Ошибка удаления навыка:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении навыка'
    });
  }
});

// Загрузка/обновление резюме
router.post('/resume', [
  protect,
  restrictTo('candidate'),
  body('text')
    .optional()
    .isLength({ min: 100, max: 10000 })
    .withMessage('Текст резюме должен содержать от 100 до 10000 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const { text, file } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    user.candidateProfile.resume = {
      text: text || user.candidateProfile.resume?.text,
      file: file || user.candidateProfile.resume?.file,
      lastUpdated: new Date()
    };
    
    user.stats.lastActive = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      data: { 
        resume: user.candidateProfile.resume 
      }
    });
  } catch (error) {
    console.error('Ошибка обновления резюме:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении резюме'
    });
  }
});

// Получение пользователей (только для админов)
router.get('/', [
  protect,
  restrictTo('admin')
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { type, isActive, search } = req.query;
    
    let query = {};
    
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении пользователей'
    });
  }
});

// Блокировка/разблокировка пользователя (админ)
router.patch('/:id/status', [
  protect,
  restrictTo('admin')
], async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: `Пользователь ${isActive ? 'разблокирован' : 'заблокирован'}`
    });
  } catch (error) {
    console.error('Ошибка обновления статуса пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении статуса пользователя'
    });
  }
});

// Получение статистики пользователя
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('stats type candidateProfile employerProfile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    let stats = {
      ...user.stats.toObject(),
      lastActive: user.stats.lastActive
    };

    // Для кандидатов - дополнительная статистика
    if (user.type === 'candidate') {
      const Application = require('../models/Application');
      
      const applicationStats = await Application.aggregate([
        { $match: { candidate: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      stats.applicationsByStatus = applicationStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      stats.totalApplications = applicationStats.reduce((sum, stat) => sum + stat.count, 0);
    }

    // Для работодателей - статистика компании
    if (user.type === 'employer' && user.employerProfile.company) {
      const company = await Company.findById(user.employerProfile.company);
      if (company) {
        stats.companyStats = company.stats;
      }
    }

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики'
    });
  }
});

// Удаление аккаунта
router.delete('/account', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        isActive: false,
        email: `deleted_${Date.now()}@deleted.com` // Освобождаем email
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Аккаунт успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления аккаунта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении аккаунта'
    });
  }
});

module.exports = router;