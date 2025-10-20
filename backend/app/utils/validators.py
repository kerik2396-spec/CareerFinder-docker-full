import re
from email_validator import validate_email, EmailNotValidError

def validate_email(email):
    try:
        valid = validate_email(email)
        return True
    except EmailNotValidError:
        return False

def validate_password(password):
    return len(password) >= 6

def validate_phone(phone):
    if not phone:
        return True
    
    phone_pattern = r'^[\+]?[0-9\s\-\(\)]{10,20}$'
    return bool(re.match(phone_pattern, phone))

def validate_salary(salary_from, salary_to):
    if salary_from and salary_to and salary_from > salary_to:
        return False
    
    if salary_from and salary_from < 0:
        return False
    
    if salary_to and salary_to < 0:
        return False
    
    return True

def sanitize_input(text):
    if not text:
        return text
    
    text = re.sub(r'[<>&\"\'\\]', '', str(text))
    return text.strip()
