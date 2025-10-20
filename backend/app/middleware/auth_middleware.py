from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except:
            return jsonify({'message': 'Valid token is required'}), 401
        return f(*args, **kwargs)
    return decorated

def employer_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.user_type != 'employer':
                return jsonify({'message': 'Employer access required'}), 403
                
        except:
            return jsonify({'message': 'Valid token is required'}), 401
            
        return f(*args, **kwargs)
    return decorated

def job_seeker_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.user_type != 'job_seeker':
                return jsonify({'message': 'Job seeker access required'}), 403
                
        except:
            return jsonify({'message': 'Valid token is required'}), 401
            
        return f(*args, **kwargs)
    return decorated
