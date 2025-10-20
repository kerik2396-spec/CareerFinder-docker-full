from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from app import db
from app.models.vacancy import Vacancy
from app.models.user import User
from app.models.application import Application

vacancies_bp = Blueprint('vacancies', __name__)

@vacancies_bp.route('/', methods=['GET'])
def get_vacancies():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        location = request.args.get('location', '')
        employment_type = request.args.get('employment_type', '')
        
        query = Vacancy.query.filter_by(is_active=True)
        
        if search:
            query = query.filter(
                or_(
                    Vacancy.title.ilike(f'%{search}%'),
                    Vacancy.description.ilike(f'%{search}%'),
                    Vacancy.requirements.ilike(f'%{search}%')
                )
            )
        
        if location:
            query = query.filter(Vacancy.location.ilike(f'%{location}%'))
            
        if employment_type:
            query = query.filter(Vacancy.employment_type == employment_type)
        
        vacancies = query.order_by(Vacancy.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'vacancies': [vacancy.to_dict() for vacancy in vacancies.items],
            'total': vacancies.total,
            'pages': vacancies.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get vacancies error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@vacancies_bp.route('/<int:vacancy_id>', methods=['GET'])
def get_vacancy(vacancy_id):
    try:
        vacancy = Vacancy.query.get_or_404(vacancy_id)
        
        if not vacancy.is_active:
            return jsonify({'message': 'Vacancy not found'}), 404
        
        vacancy.views_count += 1
        db.session.commit()
        
        return jsonify({'vacancy': vacancy.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get vacancy error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@vacancies_bp.route('/', methods=['POST'])
@jwt_required()
def create_vacancy():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.user_type != 'employer':
            return jsonify({'message': 'Only employers can create vacancies'}), 403
        
        if not user.company:
            return jsonify({'message': 'Please create a company profile first'}), 400
        
        data = request.get_json()
        
        vacancy = Vacancy(
            title=data['title'],
            description=data['description'],
            requirements=data.get('requirements', ''),
            salary_from=data.get('salary_from'),
            salary_to=data.get('salary_to'),
            location=data.get('location', ''),
            employment_type=data.get('employment_type', 'full'),
            experience_level=data.get('experience_level', 'not_required'),
            employer_id=user_id,
            company_id=user.company.id
        )
        
        db.session.add(vacancy)
        db.session.commit()
        
        return jsonify({
            'message': 'Vacancy created successfully',
            'vacancy': vacancy.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Create vacancy error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@vacancies_bp.route('/<int:vacancy_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_vacancy(vacancy_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.user_type != 'job_seeker':
            return jsonify({'message': 'Only job seekers can apply to vacancies'}), 403
        
        if not user.profile:
            return jsonify({'message': 'Please complete your profile first'}), 400
        
        vacancy = Vacancy.query.get_or_404(vacancy_id)
        
        if not vacancy.is_active:
            return jsonify({'message': 'This vacancy is no longer active'}), 400
        
        existing_application = Application.query.filter_by(
            vacancy_id=vacancy_id,
            applicant_id=user.profile.id
        ).first()
        
        if existing_application:
            return jsonify({'message': 'You have already applied to this vacancy'}), 400
        
        data = request.get_json()
        
        application = Application(
            vacancy_id=vacancy_id,
            applicant_id=user.profile.id,
            cover_letter=data.get('cover_letter', '')
        )
        
        db.session.add(application)
        db.session.commit()
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Apply to vacancy error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
