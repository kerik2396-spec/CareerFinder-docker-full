const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название компании обязательно'],
    trim: true,
    maxlength: [100, 'Название компании не может быть длиннее 100 символов'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Описание компании обязательно'],
    maxlength: [2000, 'Описание не может быть длиннее 2000 символов']
  },
  logo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  industry: {
    type: String,
    required: [true, 'Отрасль обязательна'],
    enum: [
      'it', 'finance', 'healthcare', 'education', 'retail', 
      'manufacturing', 'transportation', 'construction', 
      'entertainment', 'telecom', 'energy', 'other'
    ]
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    required: true
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, 'Неверный формат URL сайта']
  },
  founded: {
    year: Number,
    month: Number
  },
  contact: {
    email: {
      type: String,
      required: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Неверный формат email']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      country: String,
      postalCode: String
    }
  },
  social: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  culture: {
    mission: String,
    values: [String],
    benefits: [String]
  },
  // Статистика компании
  stats: {
    totalVacancies: {
      type: Number,
      default: 0
    },
    activeVacancies: {
      type: Number,
      default: 0
    },
    totalApplications: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    },
    avgResponseTime: {
      type: Number,
      default: 0
    }
  },
  // Верификация
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: String,
      description: String,
      uploadedAt: Date
    }]
  },
  // Настройки
  settings: {
    autoPublish: {
      type: Boolean,
      default: true
    },
    applicationNotifications: {
      type: Boolean,
      default: true
    },
    branding: {
      primaryColor: {
        type: String,
        default: '#2563eb'
      },
      secondaryColor: {
        type: String,
        default: '#64748b'
      }
    }
  },
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальные поля
companySchema.virtual('vacancies', {
  ref: 'Vacancy',
  localField: '_id',
  foreignField: 'company'
});

companySchema.virtual('employees', {
  ref: 'User',
  localField: '_id',
  foreignField: 'employerProfile.company'
});

companySchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.contact.address?.street) parts.push(this.contact.address.street);
  if (this.contact.address?.city) parts.push(this.contact.address.city);
  if (this.contact.address?.country) parts.push(this.contact.address.country);
  return parts.join(', ');
});

// Индексы
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ size: 1 });
companySchema.index({ 'contact.address.city': 1 });
companySchema.index({ 'verification.isVerified': -1 });
companySchema.index({ 'stats.totalVacancies': -1 });
companySchema.index({ createdAt: -1 });

// Middleware
companySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
      
    this.seo.metaTitle = this.seo.metaTitle || `${this.name} - Карьера и вакансии`;
    this.seo.metaDescription = this.seo.metaDescription || 
      `Присоединяйтесь к команде ${this.name}. ${this.description.substring(0, 150)}...`;
  }
  next();
});

companySchema.pre(/^find/, function(next) {
  this.populate('createdBy', 'profile.firstName profile.lastName profile.avatar');
  next();
});

// Статические методы
companySchema.statics.getVerifiedCompanies = function() {
  return this.find({ 
    'verification.isVerified': true, 
    isActive: true 
  });
};

companySchema.statics.searchCompanies = function(query) {
  const { search, industry, size, location } = query;
  
  const searchQuery = { isActive: true };
  
  if (search) {
    searchQuery.$text = { $search: search };
  }
  
  if (industry) {
    searchQuery.industry = industry;
  }
  
  if (size) {
    searchQuery.size = size;
  }
  
  if (location) {
    searchQuery['contact.address.city'] = new RegExp(location, 'i');
  }
  
  return this.find(searchQuery);
};

// Методы экземпляра
companySchema.methods.incrementViews = function() {
  this.stats.totalViews += 1;
  return this.save();
};

companySchema.methods.updateStats = async function() {
  const Vacancy = mongoose.model('Vacancy');
  const Application = mongoose.model('Application');
  
  const vacancyStats = await Vacancy.aggregate([
    { $match: { company: this._id } },
    {
      $group: {
        _id: null,
        totalVacancies: { $sum: 1 },
        activeVacancies: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'active'] },
                { $gt: ['$expiresAt', new Date()] }
              ]}, 1, 0
            ]
          }
        },
        totalViews: { $sum: '$stats.views' },
        totalApplications: { $sum: '$stats.applications' }
      }
    }
  ]);
  
  const applicationStats = await Application.aggregate([
    { $match: { company: this._id } },
    {
      $group: {
        _id: null,
        respondedApplications: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'pending'] }, 1, 0
            ]
          }
        },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $ne: ['$respondedAt', null] },
              { $subtract: ['$respondedAt', '$appliedAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
  
  if (vacancyStats.length > 0) {
    this.stats.totalVacancies = vacancyStats[0].totalVacancies;
    this.stats.activeVacancies = vacancyStats[0].activeVacancies;
    this.stats.totalViews = vacancyStats[0].totalViews;
    this.stats.totalApplications = vacancyStats[0].totalApplications;
  }
  
  if (applicationStats.length > 0) {
    this.stats.responseRate = this.stats.totalApplications > 0 
      ? (applicationStats[0].respondedApplications / this.stats.totalApplications) * 100 
      : 0;
    this.stats.avgResponseTime = applicationStats[0].avgResponseTime || 0;
  }
  
  return this.save();
};

companySchema.methods.verify = function(adminId) {
  this.verification.isVerified = true;
  this.verification.verifiedAt = new Date();
  this.verification.verifiedBy = adminId;
  return this.save();
};

module.exports = mongoose.model('Company', companySchema);