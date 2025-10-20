CREATE TABLE vacancies (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_logo VARCHAR(500),
    location VARCHAR(255) NOT NULL,
    salary VARCHAR(100),
    employment_type VARCHAR(20) NOT NULL,
    experience_level VARCHAR(20) NOT NULL,
    skills TEXT,
    contact_email VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    employer_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    CONSTRAINT fk_vacancy_employer 
        FOREIGN KEY (employer_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Индексы для оптимизации поиска
CREATE INDEX idx_vacancies_active ON vacancies(is_active);
CREATE INDEX idx_vacancies_employer ON vacancies(employer_id);
CREATE INDEX idx_vacancies_title ON vacancies(title);
CREATE INDEX idx_vacancies_location ON vacancies(location);
CREATE INDEX idx_vacancies_employment_type ON vacancies(employment_type);
CREATE INDEX idx_vacancies_experience_level ON vacancies(experience_level);
CREATE INDEX idx_vacancies_created_at ON vacancies(created_at DESC);