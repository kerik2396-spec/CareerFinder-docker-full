from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.profile import Profile
from app.models.user import User

profiles_bp = Blueprint('profiles', __name__)

@profiles_bp.route('/my-profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user.profile:
            return jsonify({'message': 'Profile not found'}), 404
        
        return jsonify({'profile': user.profile.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get profile error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@profiles_bp.route('/my-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user.profile:
            return jsonify({'message': 'Profile not found'}), 404
        
        data = request.get_json()
        profile = user.profile
        
        # Update fields
        if 'first_name' in data:
            profile.first_name = data['first_name']
        if 'last_name' in data:
            profile.last_name = data['last_name']
        if 'phone' in data:
            profile.phone = data['phone']
        if 'location' in data:
            profile.location = data['location']
        if 'bio' in data:
            profile.bio = data['bio']
        if 'resume_text' in data:
            profile.resume_text = data['resume_text']
        if 'experience' in data:
            profile.experience = data['experience']
        if 'education' in data:
            profile.education = data['education']
        if 'skills' in data:
            profile.skills = data['skills']
        if 'portfolio_url' in data:
            profile.portfolio_url = data['portfolio_url']
        if 'linkedin_url' in data:
            profile.linkedin_url = data['linkedin_url']
        if 'github_url' in data:
            profile.github_url = data['github_url']
        if 'desired_salary' in data:
            profile.desired_salary = data['desired_salary']
        if 'desired_job_type' in data:
            profile.desired_job_type = data['desired_job_type']
        if 'desired_location' in data:
            profile.desired_location = data['desired_location']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update profile error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@profiles_bp.route('/my-applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user.profile:
            return jsonify({'message': 'Profile not found'}), 404
        
        applications = user.profile.applications.order_by(
            db.desc('applied_at')
        ).all()
        
        return jsonify({
            'applications': [app.to_dict() for app in applications]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get applications error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
