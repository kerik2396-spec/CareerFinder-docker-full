CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    vacancy_id BIGINT NOT NULL,
    applicant_id BIGINT NOT NULL,
    cover_letter TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_application_vacancy 
        FOREIGN KEY (vacancy_id) 
        REFERENCES vacancies(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_application_applicant 
        FOREIGN KEY (applicant_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT unique_application UNIQUE (vacancy_id, applicant_id)
);

-- Индексы для оптимизации
CREATE INDEX idx_applications_vacancy ON applications(vacancy_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);