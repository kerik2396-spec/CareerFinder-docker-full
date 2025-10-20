const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email обязателен'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Неверный формат email']
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [6, 'Пароль должен содержать минимум 6 символов'],
    select: false
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'Имя обязательно'],
      trim: true,
      maxlength: [50, 'Имя не может быть длиннее 50 символов']
    },
    lastName: {
      type: String,
      required: [true, 'Фамилия обязательна'],
      trim: true,
      maxlength: [50, 'Фамилия не может быть длиннее 50 символов']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Неверный формат телефона']
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Биография не может быть длиннее 500 символов']
    },
    location: {
      city: String,
      country: String
    }
  },
  type: {
    type: String,
    enum: {
      values: ['candidate', 'employer', 'admin'],
      message: 'Тип пользователя должен быть candidate, employer или admin'
    },
    default: 'candidate'
  },
  // Для соискателей
  candidateProfile: {
    profession: String,
    experience: {
      type: String,
      enum: ['no experience', '0-1 year', '1-3 years', '3-5 years', '5+ years']
    },
    skills: [String],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startYear: Number,
      endYear: Number
    }],
    resume: {
      file: String,
      text: String,
      lastUpdated: Date
    },
    expectedSalary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'RUB'
      }
    },
    workPreferences: {
      employmentType: {
        type: [String],
        enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship']
      },
      locationType: {
        type: [String],
        enum: ['office', 'remote', 'hybrid']
      },
      relocation: {
        type: Boolean,
        default: false
      }
    }
  },
  // Для работодателей
  employerProfile: {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    position: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'standard', 'premium'],
      default: 'free'
    },
    expiresAt: Date,
    features: [String],
    isActive: {
      type: Boolean,
      default: false
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true
      },
      resumeVisible: {
        type: Boolean,
        default: true
      }
    }
  },
  stats: {
    applications: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальные поля
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

userSchema.virtual('isEmployer').get(function() {
  return this.type === 'employer';
});

userSchema.virtual('isCandidate').get(function() {
  return this.type === 'candidate';
});

// Индексы
userSchema.index({ email: 1 });
userSchema.index({ 'profile.location.city': 1 });
userSchema.index({ 'candidateProfile.skills': 1 });
userSchema.index({ 'candidateProfile.profession': 1 });
userSchema.index({ createdAt: -1 });

// Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  if (this.isModified('stats.lastActive')) {
    this.stats.lastActive = new Date();
  }
  next();
});

// Методы
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createVerificationToken = function() {
  const crypto = require('crypto');
  this.verificationToken = crypto.randomBytes(32).toString('hex');
  return this.verificationToken;
};

userSchema.methods.createPasswordResetToken = function() {
  const crypto = require('crypto');
  this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 минут
  return this.resetPasswordToken;
};

// Статические методы
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);