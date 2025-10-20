const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  vacancy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vacancy',
    required: [true, 'Вакансия обязательна']
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Кандидат обязателен']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Компания обязательна']
  },
  // Данные заявки
  resume: {
    file: String,
    text: String,
    version: {
      type: String,
      default: 'current'
    }
  },
  coverLetter: {
    text: String,
    file: String
  },
  answers: [{
    question: String,
    answer: String
  }],
  // Статус заявки
  status: {
    type: String,
    enum: [
      'applied',       // Подана
      'viewed',        // Просмотрена
      'in_review',     // На рассмотрении
      'interview',     // Приглашение на собеседование
      'offer',         // Предложение о работе
      'rejected',      // Отклонена
      'withdrawn',     // Отозвана
      'hired'          // Принята на работу
    ],
    default: 'applied'
  },
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Коммуникация
  messages: [{
    type: {
      type: String,
      enum: ['employer', 'candidate', 'system'],
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number
    }],
    isRead: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Собеседования
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'in_person', 'technical'],
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // в минутах
      default: 60
    },
    location: String,
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String
    }],
    description: String,
    feedback: {
      rating: Number,
      comment: String,
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      submittedAt: Date
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled'
    }
  }],
  // Оценки и отзывы
  ratings: {
    candidate: {
      rating: Number,
      comment: String,
      submittedAt: Date
    },
    employer: {
      rating: Number,
      comment: String,
      submittedAt: Date
    }
  },
  // Метаданные
  meta: {
    source: {
      type: String,
      enum: ['website', 'email', 'api', 'import'],
      default: 'website'
    },
    ipAddress: String,
    userAgent: String,
    referral: String
  },
  // Важные даты
  appliedAt: {
    type: Date,
    default: Date.now
  },
  viewedAt: Date,
  respondedAt: Date,
  closedAt: Date,
  // Настройки
  settings: {
    autoArchive: {
      type: Boolean,
      default: true
    },
    notifyStatusChange: {
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
applicationSchema.virtual('responseTime').get(function() {
  if (this.viewedAt && this.appliedAt) {
    return this.viewedAt - this.appliedAt;
  }
  return null;
});

applicationSchema.virtual('isRecent').get(function() {
  return Date.now() - this.appliedAt < 24 * 60 * 60 * 1000; // 24 часа
});

// Индексы
applicationSchema.index({ vacancy: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1 });
applicationSchema.index({ company: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });
applicationSchema.index({ 'messages.sentAt': -1 });

// Middleware
applicationSchema.pre('save', function(next) {
  // Автоматически добавляем запись в историю статусов при изменении
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.candidate, // В реальном приложении нужно определить, кто изменил
      timestamp: new Date()
    });
  }
  
  // Устанавливаем даты для определенных статусов
  if (this.isModified('status')) {
    switch (this.status) {
      case 'viewed':
        this.viewedAt = new Date();
        break;
      case 'rejected':
      case 'hired':
      case 'withdrawn':
        this.closedAt = new Date();
        break;
    }
  }
  
  next();
});

applicationSchema.pre(/^find/, function(next) {
  this.populate('candidate', 'profile.firstName profile.lastName profile.avatar candidateProfile.profession')
      .populate('vacancy', 'title salary location employment')
      .populate('company', 'name logo');
  next();
});

// Статические методы
applicationSchema.statics.getApplicationsByStatus = function(companyId, status) {
  return this.find({ 
    company: companyId, 
    status: status,
    isActive: true 
  }).sort({ appliedAt: -1 });
};

applicationSchema.statics.getCandidateApplications = function(candidateId) {
  return this.find({ 
    candidate: candidateId,
    isActive: true 
  }).sort({ appliedAt: -1 });
};

applicationSchema.statics.getApplicationStats = function(companyId) {
  return this.aggregate([
    { $match: { company: companyId, isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $ne: ['$viewedAt', null] },
              { $subtract: ['$viewedAt', '$appliedAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
};

// Методы экземпляра
applicationSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  return this.save();
};

applicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interviews.push(interviewData);
  this.status = 'interview';
  return this.save();
};

applicationSchema.methods.submitFeedback = function(type, feedbackData) {
  this.ratings[type] = {
    ...feedbackData,
    submittedAt: new Date()
  };
  return this.save();
};

applicationSchema.methods.withdraw = function() {
  this.status = 'withdrawn';
  this.closedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema);