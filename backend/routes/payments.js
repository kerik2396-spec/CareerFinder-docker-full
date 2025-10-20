const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Создание платежа для подписки
router.post('/subscription', [
  protect,
  body('plan')
    .isIn(['basic', 'standard', 'premium'])
    .withMessage('Укажите корректный план подписки'),
  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('autoRenew должен быть булевым значением')
], handleValidationErrors, async (req, res) => {
  try {
    const { plan, autoRenew } = req.body;

    // Создаем запись о платеже
    const payment = await Payment.createSubscriptionPayment(
      req.user.id, 
      { plan, autoRenew }, 
      'card' // По умолчанию карта
    );

    // В реальном приложении здесь будет интеграция с платежным шлюзом
    // Для демо просто помечаем платеж как успешный
    await payment.completePayment({
      transactionId: `demo_${Date.now()}`,
      cardLast4: '4242',
      cardBrand: 'visa'
    });

    // Активируем подписку пользователя
    const subscriptionExpires = new Date();
    subscriptionExpires.setDate(subscriptionExpires.getDate() + payment.subscription.duration);

    await User.findByIdAndUpdate(req.user.id, {
      'subscription.plan': plan,
      'subscription.expiresAt': subscriptionExpires,
      'subscription.isActive': true,
      'subscription.autoRenew': autoRenew,
      'subscription.features': getPlanFeatures(plan)
    });

    res.status(200).json({
      success: true,
      data: { 
        payment,
        subscription: {
          plan,
          expiresAt: subscriptionExpires,
          features: getPlanFeatures(plan)
        }
      },
      message: 'Подписка успешно активирована'
    });
  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании платежа'
    });
  }
});

// Создание платежа для услуг
router.post('/services', [
  protect,
  body('services')
    .isArray({ min: 1 })
    .withMessage('Укажите хотя бы одну услугу'),
  body('services.*.service')
    .isIn(['highlight', 'urgent', 'feature', 'database_access', 'analytics'])
    .withMessage('Укажите корректный тип услуги'),
  body('services.*.target')
    .optional()
    .isMongoId()
    .withMessage('Укажите корректный ID цели')
], handleValidationErrors, async (req, res) => {
  try {
    const { services } = req.body;

    // Создаем запись о платеже
    const payment = await Payment.createServicePayment(
      req.user.id, 
      services, 
      'card'
    );

    // Помечаем платеж как успешный (для демо)
    await payment.completePayment({
      transactionId: `demo_${Date.now()}`,
      cardLast4: '4242',
      cardBrand: 'visa'
    });

    // Применяем услуги
    await applyServices(req.user.id, services);

    res.status(200).json({
      success: true,
      data: { payment },
      message: 'Услуги успешно активированы'
    });
  } catch (error) {
    console.error('Ошибка создания платежа за услуги:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании платежа за услуги'
    });
  }
});

// Получение истории платежей пользователя
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const payments = await Payment.getUserPayments(req.user.id, limit);

    res.status(200).json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    console.error('Ошибка получения истории платежей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении истории платежей'
    });
  }
});

// Вспомогательные функции
function getPlanFeatures(plan) {
  const features = {
    basic: ['1_vacancy', 'basic_search', '50_applications'],
    standard: ['5_vacancies', 'advanced_search', '200_applications', 'highlight', 'analytics'],
    premium: ['15_vacancies', 'full_search', 'unlimited_applications', 'all_features', 'personal_manager']
  };
  
  return features[plan] || [];
}

async function applyServices(userId, services) {
  const User = require('../models/User');
  const Vacancy = require('../models/Vacancy');
  
  for (const service of services) {
    switch (service.service) {
      case 'highlight':
        if (service.target) {
          await Vacancy.findByIdAndUpdate(service.target, {
            'boosts.isHighlighted': true,
            'boosts.highlightExpires': new Date(Date.now() + (service.duration || 7) * 24 * 60 * 60 * 1000)
          });
        }
        break;
      case 'urgent':
        if (service.target) {
          await Vacancy.findByIdAndUpdate(service.target, {
            'boosts.isUrgent': true,
            'boosts.urgentExpires': new Date(Date.now() + (service.duration || 3) * 24 * 60 * 60 * 1000)
          });
        }
        break;
      case 'feature':
        if (service.target) {
          await Vacancy.findByIdAndUpdate(service.target, {
            'boosts.isFeatured': true,
            'boosts.featureExpires': new Date(Date.now() + (service.duration || 7) * 24 * 60 * 60 * 1000)
          });
        }
        break;
    }
  }
}

module.exports = router;