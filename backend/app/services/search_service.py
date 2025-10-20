from app.models.vacancy import Vacancy
from app.models.company import Company
from sqlalchemy import or_

class SearchService:
    @staticmethod
    def search_vacancies(query=None, location=None, employment_type=None, experience_level=None, page=1, per_page=20):
        search_query = Vacancy.query.filter_by(is_active=True)
        
        if query:
            search_query = search_query.filter(
                or_(
                    Vacancy.title.ilike(f'%{query}%'),
                    Vacancy.description.ilike(f'%{query}%'),
                    Vacancy.requirements.ilike(f'%{query}%')
                )
            )
        
        if location:
            search_query = search_query.filter(Vacancy.location.ilike(f'%{location}%'))
            
        if employment_type:
            search_query = search_query.filter(Vacancy.employment_type == employment_type)
            
        if experience_level:
            search_query = search_query.filter(Vacancy.experience_level == experience_level)
        
        return search_query.order_by(Vacancy.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    @staticmethod
    def search_companies(query=None, industry=None, page=1, per_page=20):
        search_query = Company.query
        
        if query:
            search_query = search_query.filter(Company.name.ilike(f'%{query}%'))
        
        if industry:
            search_query = search_query.filter(Company.industry.ilike(f'%{industry}%'))
        
        return search_query.order_by(Company.name).paginate(
            page=page, per_page=per_page, error_out=False
        )
