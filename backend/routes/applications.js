const express = require('express');
const Application = require('../models/Application');
const Vacancy = require('../models/Vacancy');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Подача заявки на вакансию
router.post('/', [
  protect,
  restrictTo('candidate'),
  body('vacancy')
    .isMongoId()
    .withMessage('Укажите корректный ID вакансии'),
  body('coverLetter.text')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Сопроводительное письмо не может превышать 2000 символов'),
  body('answers')
    .optional()
    .isArray()
    .withMessage('Ответы должны быть массивом')
], handleValidationErrors, async (req, res) => {
  try {
    const { vacancy: vacancyId, coverLetter, answers } = req.body;

    // Проверяем существование вакансии
    const vacancy = await Vacancy.findOne({
      _id: vacancyId,
      status: 'active',
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Вакансия не найдена или неактивна'
      });
    }

    // Проверяем, не подавал ли уже кандидат заявку
    const existingApplication = await Application.findOne({
      vacancy: vacancyId,
      candidate: req.user.id,
      isActive: true
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Вы уже подавали заявку на эту вакансию'
      });
    }

    // Получаем резюме кандидата
    const candidate = await User.findById(req.user.id)
      .select('candidateProfile.resume profile.firstName profile.lastName profile.email');

    if (!candidate.candidateProfile.resume) {
      return res.status(400).json({
        success: false,
        message: 'Сначала загрузите резюме в профиль'
      });
    }

    // Создаем заявку
    const applicationData = {
      vacancy: vacancyId,
      candidate: req.user.id,
      company: vacancy.company,
      resume: candidate.candidateProfile.resume,
      coverLetter,
      answers,
      meta: {
        source: 'website',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    const application = await Application.create(applicationData);

    // Обновляем статистику вакансии
    await Vacancy.findByIdAndUpdate(vacancyId, {
      $inc: { 'stats.applications': 1 }
    });

    // Обновляем статистику кандидата
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.applications': 1 }
    });

    res.status(201).json({
      success: true,
      data: { application },
      message: 'Заявка успешно отправлена'
    });
  } catch (error) {
    console.error('Ошибка подачи заявки:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при подаче заявки'
    });
  }
});

// Получение заявок кандидата
router.get('/my-applications', protect, restrictTo('candidate'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status } = req.query;
    
    let query = { 
      candidate: req.user.id,
      isActive: true 
    };
    
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('vacancy', 'title salary location employment company')
      .populate('company', 'name logo')
      .skip(skip)
      .limit(limit)
      .sort({ appliedAt: -1 });

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения заявок:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заявок'
    });
  }
});

// Получение заявок компании
router.get('/company/applications', [
  protect,
  restrictTo('employer')
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, vacancy, recent } = req.query;
    
    // Получаем компании пользователя
    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('employerProfile.company');
    
    if (!user.employerProfile.company) {
      return res.status(400).json({
        success: false,
        message: 'У вас нет компании'
      });
    }

    let query = { 
      company: user.employerProfile.company._id,
      isActive: true 
    };
    
    if (status) {
      query.status = status;
    }
    
    if (vacancy) {
      query.vacancy = vacancy;
    }
    
    if (recent === 'true') {
      query.appliedAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // Последние 7 дней
    }

    const applications = await Application.find(query)
      .populate('candidate', 'profile.firstName profile.lastName profile.avatar candidateProfile.profession candidateProfile.experience')
      .populate('vacancy', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ appliedAt: -1 });

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения заявок компании:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заявок'
    });
  }
});

// Обновление статуса заявки
router.patch('/:id/status', [
  protect,
  body('status')
    .isIn([
      'applied', 'viewed', 'in_review', 'interview', 
      'offer', 'rejected', 'withdrawn', 'hired'
    ])
    .withMessage('Укажите корректный статус'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Причина не может превышать 500 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const { status, reason } = req.body;

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    // Проверяем права доступа
    const user = await User.findById(req.user.id);
    const isEmployer = user.type === 'employer' && 
      user.employerProfile.company?.toString() === application.company.toString();
    const isCandidate = user.type === 'candidate' && 
      application.candidate.toString() === req.user.id.toString();
    
    if (!isEmployer && !isCandidate && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для изменения статуса этой заявки'
      });
    }

    // Кандидат может только отозвать заявку
    if (isCandidate && status !== 'withdrawn') {
      return res.status(403).json({
        success: false,
        message: 'Вы можете только отозвать свою заявку'
      });
    }

    application.status = status;
    
    // Добавляем запись в историю
    application.statusHistory.push({
      status,
      changedBy: req.user.id,
      reason,
      timestamp: new Date()
    });

    await application.save();

    res.status(200).json({
      success: true,
      data: { application },
      message: 'Статус заявки обновлен'
    });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении статуса заявки'
    });
  }
});

// Добавление сообщения к заявке
router.post('/:id/messages', [
  protect,
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Сообщение должно содержать от 1 до 2000 символов'),
  body('type')
    .isIn(['employer', 'candidate'])
    .withMessage('Укажите корректный тип сообщения')
], handleValidationErrors, async (req, res) => {
  try {
    const { message, type, attachments } = req.body;

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    // Проверяем права доступа
    const user = await User.findById(req.user.id);
    const isEmployer = user.type === 'employer' && 
      user.employerProfile.company?.toString() === application.company.toString();
    const isCandidate = user.type === 'candidate' && 
      application.candidate.toString() === req.user.id.toString();
    
    if (!isEmployer && !isCandidate) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для отправки сообщений'
      });
    }

    // Проверяем соответствие типа отправителя
    if ((isEmployer && type !== 'employer') || (isCandidate && type !== 'candidate')) {
      return res.status(400).json({
        success: false,
        message: 'Несоответствие типа сообщения и роли пользователя'
      });
    }

    const messageData = {
      type,
      sender: req.user.id,
      message,
      attachments: attachments || [],
      sentAt: new Date()
    };

    await application.addMessage(messageData);

    // Если работодатель пишет первый раз, меняем статус на "просмотрено"
    if (isEmployer && application.status === 'applied') {
      application.status = 'viewed';
      application.viewedAt = new Date();
      await application.save();
    }

    res.status(200).json({
      success: true,
      data: { 
        message: messageData 
      },
      message: 'Сообщение отправлено'
    });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при отправке сообщения'
    });
  }
});

// Планирование собеседования
router.post('/:id/interviews', [
  protect,
  restrictTo('employer'),
  body('type')
    .isIn(['phone', 'video', 'in_person', 'technical'])
    .withMessage('Укажите корректный тип собеседования'),
  body('scheduledAt')
    .isISO8601()
    .withMessage('Укажите корректную дату и время'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Длительность должна быть от 15 до 480 минут'),
  body('participants')
    .isArray({ min: 1 })
    .withMessage('Укажите хотя бы одного участника')
], handleValidationErrors, async (req, res) => {
  try {
    const { type, scheduledAt, duration, participants, description, location } = req.body;

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    // Проверяем права доступа
    const user = await User.findById(req.user.id);
    const isEmployer = user.employerProfile.company?.toString() === application.company.toString();
    
    if (!isEmployer) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для планирования собеседования'
      });
    }

    const interviewData = {
      type,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      participants,
      description,
      location
    };

    await application.scheduleInterview(interviewData);

    res.status(201).json({
      success: true,
      data: { 
        interview: interviewData 
      },
      message: 'Собеседование запланировано'
    });
  } catch (error) {
    console.error('Ошибка планирования собеседования:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при планировании собеседования'
    });
  }
});

// Получение статистики заявок
router.get('/company/stats', protect, restrictTo('employer'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('employerProfile.company');
    
    if (!user.employerProfile.company) {
      return res.status(400).json({
        success: false,
        message: 'У вас нет компании'
      });
    }

    const stats = await Application.getApplicationStats(user.employerProfile.company._id);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики заявок'
    });
  }
});

module.exports = router;