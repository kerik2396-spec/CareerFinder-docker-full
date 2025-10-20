package com.careerfinder.dto;

import com.careerfinder.models.Application;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplicationDto {
    private Long id;
    private Long vacancyId;
    private String vacancyTitle;
    private String companyName;
    private Long applicantId;
    private String applicantName;
    private String applicantEmail;
    private String coverLetter;
    private Application.ApplicationStatus status;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    public ApplicationDto(Application application) {
        this.id = application.getId();
        this.vacancyId = application.getVacancy().getId();
        this.vacancyTitle = application.getVacancy().getTitle();
        this.companyName = application.getVacancy().getCompanyName();
        this.applicantId = application.getApplicant().getId();
        this.applicantName = application.getApplicant().getFirstName() + " " + application.getApplicant().getLastName();
        this.applicantEmail = application.getApplicant().getEmail();
        this.coverLetter = application.getCoverLetter();
        this.status = application.getStatus();
        this.appliedAt = application.getAppliedAt();
        this.updatedAt = application.getUpdatedAt();
    }
}