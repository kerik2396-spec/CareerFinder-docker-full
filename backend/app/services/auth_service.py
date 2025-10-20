from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
import secrets
import string

class AuthService:
    @staticmethod
    def create_user(username, email, password, user_type='job_seeker'):
        user = User(
            username=username,
            email=email,
            user_type=user_type
        )
        user.set_password(password)
        return user
    
    @staticmethod
    def verify_user(email, password):
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            return user
        return None
    
    @staticmethod
    def generate_reset_token():
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for i in range(32))
    
    @staticmethod
    def change_password(user, new_password):
        user.set_password(new_password)
        return user
    
    @staticmethod
    def validate_user_data(username, email, password):
        errors = []
        
        if not username or len(username) < 3:
            errors.append('Username must be at least 3 characters long')
        
        if not email or '@' not in email:
            errors.append('Valid email is required')
        
        if not password or len(password) < 6:
            errors.append('Password must be at least 6 characters long')
        
        if User.query.filter_by(username=username).first():
            errors.append('Username already taken')
        
        if User.query.filter_by(email=email).first():
            errors.append('Email already registered')
        
        return errors
