const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - проверка аутентификации
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Для доступа необходимо войти в систему'
      });
    }

    // Верификация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Получение пользователя из базы
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Аккаунт заблокирован. Обратитесь в поддержку.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return res.status(401).json({
      success: false,
      message: 'Неверный токен доступа'
    });
  }
};

// Проверка ролей
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.type)) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав для выполнения этого действия'
      });
    }
    next();
  };
};

// Проверка владельца ресурса (или админ)
exports.checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const document = await model.findById(req.params[paramName]);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Ресурс не найден'
        });
      }

      // Проверяем, является ли пользователь владельцем или админом
      const isOwner = document.createdBy && document.createdBy.toString() === req.user.id;
      const isAdmin = req.user.type === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'У вас нет прав для доступа к этому ресурсу'
        });
      }

      req.document = document;
      next();
    } catch (error) {
      console.error('Ошибка проверки прав доступа:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при проверке прав доступа'
      });
    }
  };
};