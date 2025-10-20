package com.careerfinder.dto;

import com.careerfinder.models.Vacancy;
import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class CreateVacancyRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String companyLogo;

    @NotBlank(message = "Location is required")
    private String location;

    private String salary;

    @NotNull(message = "Employment type is required")
    private Vacancy.EmploymentType employmentType;

    @NotNull(message = "Experience level is required")
    private Vacancy.ExperienceLevel experienceLevel;

    private String skills;

    @NotBlank(message = "Contact email is required")
    private String contactEmail;

    private String website;
}