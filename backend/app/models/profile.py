from app import db
from datetime import datetime

class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100))
    bio = db.Column(db.Text)
    resume_text = db.Column(db.Text)
    experience = db.Column(db.Text)
    education = db.Column(db.Text)
    skills = db.Column(db.Text)
    portfolio_url = db.Column(db.String(200))
    linkedin_url = db.Column(db.String(200))
    github_url = db.Column(db.String(200))
    photo = db.Column(db.String(255))
    desired_salary = db.Column(db.Integer)
    desired_job_type = db.Column(db.String(50))
    desired_location = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    applications = db.relationship('Application', backref='applicant', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f'{self.first_name or ""} {self.last_name or ""}'.strip(),
            'phone': self.phone,
            'location': self.location,
            'bio': self.bio,
            'resume_text': self.resume_text,
            'experience': self.experience,
            'education': self.education,
            'skills': self.skills,
            'portfolio_url': self.portfolio_url,
            'linkedin_url': self.linkedin_url,
            'github_url': self.github_url,
            'photo': self.photo,
            'desired_salary': self.desired_salary,
            'desired_job_type': self.desired_job_type,
            'desired_location': self.desired_location,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id,
            'applications_count': self.applications.count()
        }
    
    def __repr__(self):
        return f'<Profile {self.first_name} {self.last_name}>'
