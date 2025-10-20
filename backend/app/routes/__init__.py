from .auth import auth_bp
from .vacancies import vacancies_bp
from .companies import companies_bp
from .profiles import profiles_bp
from .api import api_bp

__all__ = ['auth_bp', 'vacancies_bp', 'companies_bp', 'profiles_bp', 'api_bp']
