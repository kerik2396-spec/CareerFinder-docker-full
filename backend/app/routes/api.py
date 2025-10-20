from flask import Blueprint, jsonify
from app.models.vacancy import Vacancy
from app.models.company import Company

api_bp = Blueprint('api', __name__)

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        total_vacancies = Vacancy.query.filter_by(is_active=True).count()
        total_companies = Company.query.count()
        
        return jsonify({
            'total_vacancies': total_vacancies,
            'total_companies': total_companies,
            'status': 'success'
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Internal server error'}), 500

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'CareerFinder API'}), 200
