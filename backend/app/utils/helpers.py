from datetime import datetime

def format_salary(salary_from, salary_to, currency='RUB'):
    if salary_from and salary_to:
        return f'{salary_from:,} - {salary_to:,} {currency}'.replace(',', ' ')
    elif salary_from:
        return f'from {salary_from:,} {currency}'.replace(',', ' ')
    elif salary_to:
        return f'up to {salary_to:,} {currency}'.replace(',', ' ')
    else:
        return 'Salary not specified'

def format_date(date):
    if not date:
        return ''
    return date.strftime('%d.%m.%Y')

def generate_slug(text):
    if not text:
        return ''
    return text.lower().replace(' ', '-').replace('/', '-')[:100]

def calculate_experience_level(years):
    if years < 1:
        return 'no experience'
    elif years < 3:
        return 'junior'
    elif years < 5:
        return 'middle'
    else:
        return 'senior'
