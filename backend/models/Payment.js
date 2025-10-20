const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Пользователь обязателен']
  },
  type: {
    type: String,
    enum: ['subscription', 'service', 'boost', 'refund'],
    required: true
  },
  // Для подписок
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'standard', 'premium']
    },
    duration: {
      type: Number, // в днях
      default: 30
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  // Для услуг
  services: [{
    service: {
      type: String,
      enum: ['highlight', 'urgent', 'feature', 'database_access', 'analytics']
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'services.targetModel'
    },
    targetModel: {
      type: String,
      enum: ['Vacancy', 'Company']
    },
    duration: Number,
    price: Number
  }],
  // Детали платежа
  amount: {
    total: {
      type: Number,
      required: [true, 'Сумма платежа обязательна'],
      min: [0, 'Сумма не может быть отрицательной']
    },
    subtotal: Number,
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'RUB',
      enum: ['RUB', 'USD', 'EUR']
    }
  },
  // Платежная информация
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'electronic', 'cash'],
    required: true
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    bankName: String,
    transactionId: String
  },
  // Статус платежа
  status: {
    type: String,
    enum: [
      'pending',      // Ожидает оплаты
      'processing',   // В обработке
      'completed',    // Завершен
      'failed',       // Неудачный
      'refunded',     // Возвращен
      'cancelled'     // Отменен
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Внешние идентификаторы
  externalIds: {
    stripePaymentIntent: String,
    stripeSubscription: String,
    yookassaPaymentId: String
  },
  // Метаданные
  meta: {
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  // Важные даты
  createdAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date,
  refundedAt: Date,
  expiresAt: Date,
  // Настройки
  settings: {
    sendReceipt: {
      type: Boolean,
      default: true
    },
    notifyStatus: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальные поля
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

paymentSchema.virtual('isRefundable').get(function() {
  return this.status === 'completed' && 
         this.paidAt && 
         Date.now() - this.paidAt < 30 * 24 * 60 * 60 * 1000; // 30 дней
});

paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: this.amount.currency
  }).format(this.amount.total / 100);
});

// Индексы
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ 'externalIds.stripePaymentIntent': 1 });
paymentSchema.index({ 'meta.invoiceNumber': 1 });

// Middleware
paymentSchema.pre('save', function(next) {
  // Генерация номера счета
  if (this.isNew && !this.meta.invoiceNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.meta.invoiceNumber = `INV-${timestamp}-${random}`;
  }
  
  // Добавление в историю статусов
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  
  // Установка дат для определенных статусов
  if (this.isModified('status')) {
    switch (this.status) {
      case 'completed':
        this.paidAt = new Date();
        break;
      case 'refunded':
        this.refundedAt = new Date();
        break;
    }
  }
  
  next();
});

// Статические методы
paymentSchema.statics.getUserPayments = function(userId, limit = 10) {
  return this.find({ 
    user: userId,
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

paymentSchema.statics.getRevenueStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          type: '$type'
        },
        totalAmount: { $sum: '$amount.total' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);
};

paymentSchema.statics.createSubscriptionPayment = function(userId, planData, paymentMethod) {
  const plans = {
    basic: { price: 299000, duration: 30 }, // 2990 руб в копейках
    standard: { price: 799000, duration: 30 },
    premium: { price: 1499000, duration: 30 }
  };
  
  const plan = plans[planData.plan];
  
  return this.create({
    user: userId,
    type: 'subscription',
    subscription: {
      plan: planData.plan,
      duration: plan.duration,
      autoRenew: planData.autoRenew || false
    },
    amount: {
      total: plan.price,
      subtotal: plan.price,
      currency: 'RUB'
    },
    paymentMethod: paymentMethod,
    meta: {
      description: `Подписка ${planData.plan} на ${plan.duration} дней`
    }
  });
};

paymentSchema.statics.createServicePayment = function(userId, services, paymentMethod) {
  const servicePrices = {
    highlight: 50000,    // 500 руб
    urgent: 30000,       // 300 руб
    feature: 150000,     // 1500 руб
    database_access: 500000, // 5000 руб
    analytics: 80000     // 800 руб
  };
  
  const servicesWithPrices = services.map(service => ({
    ...service,
    price: servicePrices[service.service] || 0
  }));
  
  const subtotal = servicesWithPrices.reduce((sum, service) => sum + service.price, 0);
  const tax = Math.round(subtotal * 0.2); // 20% НДС
  const total = subtotal + tax;
  
  return this.create({
    user: userId,
    type: 'service',
    services: servicesWithPrices,
    amount: {
      total: total,
      subtotal: subtotal,
      tax: tax,
      currency: 'RUB'
    },
    paymentMethod: paymentMethod,
    meta: {
      description: `Оплата услуг: ${services.map(s => s.service).join(', ')}`
    }
  });
};

// Методы экземпляра
paymentSchema.methods.completePayment = function(transactionData = {}) {
  this.status = 'completed';
  this.paymentDetails = { ...this.paymentDetails, ...transactionData };
  return this.save();
};

paymentSchema.methods.failPayment = function(reason) {
  this.status = 'failed';
  if (reason) {
    this.statusHistory.push({
      status: 'failed',
      reason: reason,
      timestamp: new Date()
    });
  }
  return this.save();
};

paymentSchema.methods.refundPayment = function(reason) {
  this.status = 'refunded';
  if (reason) {
    this.statusHistory.push({
      status: 'refunded',
      reason: reason,
      timestamp: new Date()
    });
  }
  return this.save();
};

paymentSchema.methods.generateReceipt = function() {
  return {
    invoiceNumber: this.meta.invoiceNumber,
    date: this.paidAt || this.createdAt,
    customer: this.user,
    items: this.services.map(service => ({
      description: `Услуга: ${service.service}`,
      quantity: 1,
      price: service.price / 100,
      amount: service.price / 100
    })),
    subtotal: this.amount.subtotal / 100,
    tax: this.amount.tax / 100,
    total: this.amount.total / 100,
    currency: this.amount.currency
  };
};

module.exports = mongoose.model('Payment', paymentSchema);