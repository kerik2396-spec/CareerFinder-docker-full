from app import db
from datetime import datetime

class Vacancy(db.Model):
    __tablename__ = 'vacancies'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text)
    salary_from = db.Column(db.Integer)
    salary_to = db.Column(db.Integer)
    currency = db.Column(db.String(3), default='RUB')
    location = db.Column(db.String(100))
    employment_type = db.Column(db.String(50))
    experience_level = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    views_count = db.Column(db.Integer, default=0)
    
    employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    company = db.relationship('Company', backref=db.backref('vacancies', lazy='dynamic'))
    applications = db.relationship('Application', backref='vacancy', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'requirements': self.requirements,
            'salary_from': self.salary_from,
            'salary_to': self.salary_to,
            'currency': self.currency,
            'location': self.location,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'views_count': self.views_count,
            'employer_id': self.employer_id,
            'company_id': self.company_id,
            'company': self.company.to_dict() if self.company else None,
            'applications_count': self.applications.count()
        }
    
    def __repr__(self):
        return f'<Vacancy {self.title}>'
