package com.careerfinder.dto;

import com.careerfinder.models.Vacancy;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VacancyDto {
    private Long id;
    private String title;
    private String description;
    private String companyName;
    private String companyLogo;
    private String location;
    private String salary;
    private Vacancy.EmploymentType employmentType;
    private Vacancy.ExperienceLevel experienceLevel;
    private String skills;
    private String contactEmail;
    private String website;
    private Boolean isActive;
    private Long employerId;
    private String employerName;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    // Конструктор для преобразования Entity в DTO
    public VacancyDto(Vacancy vacancy) {
        this.id = vacancy.getId();
        this.title = vacancy.getTitle();
        this.description = vacancy.getDescription();
        this.companyName = vacancy.getCompanyName();
        this.companyLogo = vacancy.getCompanyLogo();
        this.location = vacancy.getLocation();
        this.salary = vacancy.getSalary();
        this.employmentType = vacancy.getEmploymentType();
        this.experienceLevel = vacancy.getExperienceLevel();
        this.skills = vacancy.getSkills();
        this.contactEmail = vacancy.getContactEmail();
        this.website = vacancy.getWebsite();
        this.isActive = vacancy.getIsActive();
        this.employerId = vacancy.getEmployer().getId();
        this.employerName = vacancy.getEmployer().getFirstName() + " " + vacancy.getEmployer().getLastName();
        this.createdAt = vacancy.getCreatedAt();
        this.expiresAt = vacancy.getExpiresAt();
    }
}