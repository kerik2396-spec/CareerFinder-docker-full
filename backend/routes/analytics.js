const express = require('express');
const Vacancy = require('../models/Vacancy');
const Company = require('../models/Company');
const Application = require('../models/Application');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

// Получение общей статистики платформы (только для админов)
router.get('/platform', [
  protect,
  restrictTo('admin')
], async (req, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalVacancies,
      totalApplications,
      activeVacancies,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Company.countDocuments({ isActive: true }),
      Vacancy.countDocuments({ isActive: true }),
      Application.countDocuments({ isActive: true }),
      Vacancy.countDocuments({ 
        isActive: true, 
        status: 'active',
        expiresAt: { $gt: new Date() }
      }),
      User.countDocuments({ 
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Статистика по типам пользователей
    const userTypes = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Статистика по отраслям компаний
    const companyIndustries = await Company.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCompanies,
          totalVacancies,
          totalApplications,
          activeVacancies,
          recentUsers
        },
        userTypes,
        companyIndustries
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики платформы:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики платформы'
    });
  }
});

// Получение аналитики для работодателя
router.get('/employer', protect, restrictTo('employer'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('employerProfile.company');
    
    if (!user.employerProfile.company) {
      return res.status(400).json({
        success: false,
        message: 'У вас нет компании'
      });
    }

    const companyId = user.employerProfile.company._id;

    // Основная статистика компании
    const companyStats = await Company.findById(companyId).select('stats');

    // Статистика по вакансиям
    const vacancyStats = await Vacancy.aggregate([
      { $match: { company: companyId, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$stats.views' },
          totalApplications: { $sum: '$stats.applications' },
          avgApplications: { $avg: '$stats.applications' }
        }
      }
    ]);

    // Статистика по заявкам за последние 30 дней
    const applicationTrends = await Application.aggregate([
      { 
        $match: { 
          company: companyId,
          appliedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Топ вакансий по просмотрам
    const topVacancies = await Vacancy.find({ company: companyId })
      .select('title stats.views stats.applications createdAt')
      .sort({ 'stats.views': -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        companyStats,
        vacancyStats,
        applicationTrends,
        topVacancies
      }
    });
  } catch (error) {
    console.error('Ошибка получения аналитики работодателя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении аналитики'
    });
  }
});

// Получение аналитики для кандидата
router.get('/candidate', protect, restrictTo('candidate'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('stats candidateProfile');

    // Статистика по заявкам
    const applicationStats = await Application.aggregate([
      { $match: { candidate: req.user.id, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Процент успешных заявок (интервью + офферы)
    const successfulApplications = applicationStats
      .filter(stat => ['interview', 'offer', 'hired'].includes(stat._id))
      .reduce((sum, stat) => sum + stat.count, 0);

    const totalApplications = applicationStats.reduce((sum, stat) => sum + stat.count, 0);
    const successRate = totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0;

    // Тенденции по отраслям
    const industryTrends = await Application.aggregate([
      { $match: { candidate: req.user.id, isActive: true } },
      {
        $lookup: {
          from: 'vacancies',
          localField: 'vacancy',
          foreignField: '_id',
          as: 'vacancy'
        }
      },
      { $unwind: '$vacancy' },
      {
        $lookup: {
          from: 'companies',
          localField: 'vacancy.company',
          foreignField: '_id',
          as: 'company'
        }
      },
      { $unwind: '$company' },
      {
        $group: {
          _id: '$company.industry',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        userStats: user.stats,
        applicationStats,
        successRate: Math.round(successRate),
        industryTrends
      }
    });
  } catch (error) {
    console.error('Ошибка получения аналитики кандидата:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении аналитики'
    });
  }
});

module.exports = router;