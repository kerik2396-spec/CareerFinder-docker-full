from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.vacancies import vacancies_bp
    from app.routes.companies import companies_bp
    from app.routes.profiles import profiles_bp
    from app.routes.api import api_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(vacancies_bp, url_prefix='/vacancies')
    app.register_blueprint(companies_bp, url_prefix='/companies')
    app.register_blueprint(profiles_bp, url_prefix='/profile')
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    return app
