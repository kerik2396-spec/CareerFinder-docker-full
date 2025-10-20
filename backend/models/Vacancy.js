const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название вакансии обязательно'],
    trim: true,
    maxlength: [100, 'Название не может быть длиннее 100 символов']
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Работодатель обязателен']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Компания обязательна']
  },
  description: {
    type: String,
    required: [true, 'Описание вакансии обязательно'],
    maxlength: [5000, 'Описание не может быть длиннее 5000 символов']
  },
  requirements: {
    experience: {
      type: String,
      enum: ['no experience', '0-1 year', '1-3 years', '3-5 years', '5+ years'],
      required: true
    },
    skills: [{
      type: String,
      trim: true
    }],
    education: {
      type: String,
      enum: ['none', 'secondary', 'bachelor', 'master', 'phd']
    }
  },
  salary: {
    min: {
      type: Number,
      required: [true, 'Минимальная зарплата обязательна'],
      min: [0, 'Зарплата не может быть отрицательной']
    },
    max: {
      type: Number,
      required: [true, 'Максимальная зарплата обязательна'],
      validate: {
        validator: function(value) {
          return value >= this.salary.min;
        },
        message: 'Максимальная зарплата должна быть больше минимальной'
      }
    },
    currency: {
      type: String,
      default: 'RUB',
      enum: ['RUB', 'USD', 'EUR']
    },
    isGross: {
      type: Boolean,
      default: true
    }
  },
  location: {
    city: {
      type: String,
      required: [true, 'Город обязателен']
    },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  employment: {
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      required: true
    },
    schedule: {
      type: String,
      enum: ['office', 'remote', 'hybrid'],
      required: true
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      'it', 'marketing', 'sales', 'design', 'finance', 
      'hr', 'management', 'support', 'other'
    ]
  },
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active'
  },
  // Платные функции
  boosts: {
    isHighlighted: {
      type: Boolean,
      default: false
    },
    isUrgent: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    highlightExpires: Date,
    urgentExpires: Date,
    featureExpires: Date
  },
  // Статистика
  stats: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  // Настройки
  settings: {
    applicationMethod: {
      type: String,
      enum: ['internal', 'external', 'both'],
      default: 'internal'
    },
    externalUrl: String,
    requiresResume: {
      type: Boolean,
      default: true
    },
    requiresCoverLetter: {
      type: Boolean,
      default: false
    },
    autoReply: {
      type: Boolean,
      default: false
    },
    autoReplyMessage: String
  },
  // Метаданные
  meta: {
    slug: {
      type: String,
      unique: true,
      sparse: true
    },
    lastApplicationAt: Date,
    lastRefreshedAt: {
      type: Date,
      default: Date.now
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
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
vacancySchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

vacancySchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'vacancy'
});

vacancySchema.virtual('isBoosted').get(function() {
  return this.boosts.isHighlighted || this.boosts.isUrgent || this.boosts.isFeatured;
});

// Индексы
vacancySchema.index({ title: 'text', description: 'text', tags: 'text' });
vacancySchema.index({ 'location.city': 1 });
vacancySchema.index({ category: 1 });
vacancySchema.index({ 'salary.min': 1, 'salary.max': 1 });
vacancySchema.index({ status: 1 });
vacancySchema.index({ employer: 1 });
vacancySchema.index({ expiresAt: 1 });
vacancySchema.index({ createdAt: -1 });
vacancySchema.index({ 'boosts.isFeatured': -1, createdAt: -1 });

// Middleware
vacancySchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.meta.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100) + '-' + Date.now().toString().slice(-6);
  }
  next();
});

vacancySchema.pre(/^find/, function(next) {
  this.populate('company', 'name logo industry');
  this.populate('employer', 'profile.firstName profile.lastName profile.avatar');
  next();
});

// Статические методы
vacancySchema.statics.getActiveVacancies = function() {
  return this.find({ 
    status: 'active', 
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

vacancySchema.statics.searchVacancies = function(query) {
  const {
    search,
    location,
    category,
    experience,
    salaryMin,
    salaryMax,
    employmentType,
    isRemote
  } = query;

  const searchQuery = { 
    status: 'active', 
    isActive: true,
    expiresAt: { $gt: new Date() }
  };

  if (search) {
    searchQuery.$text = { $search: search };
  }

  if (location) {
    searchQuery['location.city'] = new RegExp(location, 'i');
  }

  if (category) {
    searchQuery.category = category;
  }

  if (experience) {
    searchQuery['requirements.experience'] = experience;
  }

  if (salaryMin || salaryMax) {
    searchQuery['salary.min'] = {};
    if (salaryMin) searchQuery['salary.min'].$gte = parseInt(salaryMin);
    if (salaryMax) searchQuery['salary.max'] = { $lte: parseInt(salaryMax) };
  }

  if (employmentType) {
    searchQuery['employment.type'] = employmentType;
  }

  if (isRemote !== undefined) {
    searchQuery['location.isRemote'] = isRemote === 'true';
  }

  return this.find(searchQuery);
};

// Методы экземпляра
vacancySchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

vacancySchema.methods.refresh = function() {
  this.meta.lastRefreshedAt = new Date();
  return this.save();
};

vacancySchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

vacancySchema.methods.boost = function(type, durationDays = 7) {
  const expires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  
  switch (type) {
    case 'highlight':
      this.boosts.isHighlighted = true;
      this.boosts.highlightExpires = expires;
      break;
    case 'urgent':
      this.boosts.isUrgent = true;
      this.boosts.urgentExpires = expires;
      break;
    case 'feature':
      this.boosts.isFeatured = true;
      this.boosts.featureExpires = expires;
      break;
  }
  
  return this.save();
};

module.exports = mongoose.model('Vacancy', vacancySchema);