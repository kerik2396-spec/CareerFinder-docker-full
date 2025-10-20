from app import db
from datetime import datetime

class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    cover_letter = db.Column(db.Text)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')
    employer_notes = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    vacancy_id = db.Column(db.Integer, db.ForeignKey('vacancies.id'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cover_letter': self.cover_letter,
            'applied_at': self.applied_at.isoformat(),
            'status': self.status,
            'employer_notes': self.employer_notes,
            'updated_at': self.updated_at.isoformat(),
            'vacancy_id': self.vacancy_id,
            'applicant_id': self.applicant_id,
            'vacancy': {
                'title': self.vacancy.title,
                'company_name': self.vacancy.company.name
            } if self.vacancy else None,
            'applicant': {
                'full_name': self.applicant.full_name,
                'email': self.applicant.user.email
            } if self.applicant else None
        }
    
    def __repr__(self):
        return f'<Application {self.id} for Vacancy {self.vacancy_id}>'
