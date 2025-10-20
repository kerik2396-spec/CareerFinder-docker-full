const { validationResult } = require('express-validator');

// Обработчик ошибок валидации
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации данных',
      errors: errorMessages
    });
  }
  
  next();
};

// Санитизация входных данных
exports.sanitizeInput = (req, res, next) => {
  // Рекурсивная функция для санитизации строк
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        
        // Удаляем потенциально опасные символы
        obj[key] = obj[key].replace(/[<>]/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }
  
  next();
};