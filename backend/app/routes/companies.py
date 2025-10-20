from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.company import Company
from app.models.user import User

companies_bp = Blueprint('companies', __name__)

@companies_bp.route('/', methods=['GET'])
def get_companies():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = Company.query
        
        if search:
            query = query.filter(Company.name.ilike(f'%{search}%'))
        
        companies = query.order_by(Company.name).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'companies': [company.to_dict() for company in companies.items],
            'total': companies.total,
            'pages': companies.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get companies error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@companies_bp.route('/<int:company_id>', methods=['GET'])
def get_company(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        return jsonify({'company': company.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get company error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@companies_bp.route('/my-company', methods=['GET'])
@jwt_required()
def get_my_company():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user.company:
            return jsonify({'message': 'Company not found'}), 404
        
        return jsonify({'company': user.company.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get my company error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@companies_bp.route('/my-company', methods=['PUT'])
@jwt_required()
def update_company():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user.company:
            return jsonify({'message': 'Company not found'}), 404
        
        data = request.get_json()
        company = user.company
        
        # Update fields
        if 'name' in data:
            company.name = data['name']
        if 'description' in data:
            company.description = data['description']
        if 'website' in data:
            company.website = data['website']
        if 'phone' in data:
            company.phone = data['phone']
        if 'email' in data:
            company.email = data['email']
        if 'address' in data:
            company.address = data['address']
        if 'industry' in data:
            company.industry = data['industry']
        if 'company_size' in data:
            company.company_size = data['company_size']
        if 'founded_year' in data:
            company.founded_year = data['founded_year']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company updated successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update company error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
