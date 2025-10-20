const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { handleValidationErrors } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Генерация JWT токена
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Создание и отправка токена
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Настройки cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('token', token, cookieOptions);

  // Убираем пароль из вывода
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user }
  });
};

// Регистрация
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Укажите корректный email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  body('profile.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Имя должно содержать от 1 до 50 символов'),
  body('profile.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Фамилия должна содержать от 1 до 50 символов'),
  body('type')
    .optional()
    .isIn(['candidate', 'employer'])
    .withMessage('Тип пользователя должен быть candidate или employer')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password, profile, type = 'candidate' } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем пользователя
    const user = await User.create({
      email,
      password,
      profile,
      type
    });

    createSendToken(user, 201, res);
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при регистрации пользователя'
    });
  }
});

// Вход в систему
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Укажите корректный email'),
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверяем email и пароль
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Укажите email и пароль'
      });
    }

    // Находим пользователя и включаем пароль для проверки
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Аккаунт заблокирован'
      });
    }

    // Обновляем время последней активности
    user.stats.lastActive = new Date();
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при входе в систему'
    });
  }
});

// Выход из системы
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Выход выполнен успешно'
  });
});

// Запрос сброса пароля
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Укажите корректный email')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь с таким email не найден'
      });
    }

    // Генерируем токен сброса
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // В реальном приложении здесь будет отправка email
    console.log('Reset token:', resetToken);

    res.status(200).json({
      success: true,
      message: 'Инструкции по сбросу пароля отправлены на email'
    });
  } catch (error) {
    console.error('Ошибка запроса сброса пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при запросе сброса пароля'
    });
  }
});

// Сброс пароля
router.patch('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Находим пользователя по токену и проверяем срок действия
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Токен неверен или срок его действия истек'
      });
    }

    // Устанавливаем новый пароль
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Ошибка сброса пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при сбросе пароля'
    });
  }
});

// Обновление текущего пароля
router.patch('/update-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Текущий пароль обязателен'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Новый пароль должен содержать минимум 6 символов')
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Получаем пользователя с паролем
    const user = await User.findById(req.user.id).select('+password');

    // Проверяем текущий пароль
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Текущий пароль неверен'
      });
    }

    // Обновляем пароль
    user.password = newPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Ошибка обновления пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении пароля'
    });
  }
});

module.exports = router;