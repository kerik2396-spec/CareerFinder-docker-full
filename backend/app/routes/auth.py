from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.profile import Profile
from app.models.company import Company
from app.utils.validators import validate_email, validate_password
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        if not validate_email(data['email']):
            return jsonify({'message': 'Invalid email format'}), 400
        
        if not validate_password(data['password']):
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'User already exists with this email'}), 409
        
        if User.query.filter_by(username=data.get('username', '')).first():
            return jsonify({'message': 'Username already taken'}), 409
        
        user = AuthService.create_user(
            username=data.get('username', data['email'].split('@')[0]),
            email=data['email'],
            password=data['password'],
            user_type=data.get('user_type', 'job_seeker')
        )
        
        db.session.add(user)
        db.session.commit()
        
        if user.user_type == 'job_seeker':
            profile = Profile(user_id=user.id)
            db.session.add(profile)
        elif user.user_type == 'employer':
            company = Company(
                user_id=user.id, 
                name=data.get('company_name', f'Company of {user.username}')
            )
            db.session.add(company)
        
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Registration error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            if not user.is_active:
                return jsonify({'message': 'Account is deactivated'}), 403
                
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        
        return jsonify({'message': 'Invalid email or password'}), 401
        
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get user error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
