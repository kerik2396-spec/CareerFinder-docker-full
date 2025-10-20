package com.careerfinder.controllers;

import com.careerfinder.dto.ApplicationDto;
import com.careerfinder.models.Application;
import com.careerfinder.models.User;
import com.careerfinder.models.Vacancy;
import com.careerfinder.repositories.ApplicationRepository;
import com.careerfinder.repositories.UserRepository;
import com.careerfinder.repositories.VacancyRepository;
import com.careerfinder.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final VacancyRepository vacancyRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createApplication(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Long vacancyId = Long.parseLong(request.get("vacancyId"));
        String coverLetter = request.get("coverLetter");

        // Проверяем существование вакансии
        Optional<Vacancy> vacancy = vacancyRepository.findById(vacancyId);
        if (vacancy.isEmpty() || !vacancy.get().getIsActive()) {
            return ResponseEntity.badRequest().body("Vacancy not found or inactive");
        }

        // Проверяем, не откликался ли уже пользователь
        if (applicationRepository.existsByVacancyIdAndApplicantId(vacancyId, userPrincipal.getId())) {
            return ResponseEntity.badRequest().body("You have already applied for this vacancy");
        }

        // Получаем пользователя
        Optional<User> applicant = userRepository.findById(userPrincipal.getId());
        if (applicant.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        // Создаем отклик
        Application application = new Application();
        application.setVacancy(vacancy.get());
        application.setApplicant(applicant.get());
        application.setCoverLetter(coverLetter);

        Application savedApplication = applicationRepository.save(application);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Application submitted successfully");
        response.put("applicationId", savedApplication.getId().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyApplications(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        List<Application> applications = applicationRepository.findByApplicantIdOrderByAppliedAtDesc(userPrincipal.getId());
        
        List<ApplicationDto> applicationDtos = applications.stream()
                .map(ApplicationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(applicationDtos);
    }

    @GetMapping("/vacancy/{vacancyId}")
    @PreAuthorize("hasRole('EMPLOYER') or hasRole('ADMIN')")
    public ResponseEntity<?> getApplicationsForVacancy(
            @PathVariable Long vacancyId,
            Authentication authentication) {
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Optional<Vacancy> vacancy = vacancyRepository.findById(vacancyId);

        if (vacancy.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Проверяем, что пользователь является владельцем вакансии
        if (!vacancy.get().getEmployer().getId().equals(userPrincipal.getId()) && 
            !authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body("Access denied");
        }

        List<Application> applications = applicationRepository.findByVacancyIdOrderByAppliedAtDesc(vacancyId);
        List<ApplicationDto> applicationDtos = applications.stream()
                .map(ApplicationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(applicationDtos);
    }

    @GetMapping("/employer/my-vacancies-applications")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getApplicationsForMyVacancies(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        List<Application> applications = applicationRepository.findByVacancyEmployerIdOrderByAppliedAtDesc(userPrincipal.getId());
        
        List<ApplicationDto> applicationDtos = applications.stream()
                .map(ApplicationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(applicationDtos);
    }

    @PutMapping("/{applicationId}/status")
    @PreAuthorize("hasRole('EMPLOYER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Optional<Application> applicationOpt = applicationRepository.findById(applicationId);

        if (applicationOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application application = applicationOpt.get();

        // Проверяем права доступа
        if (!application.getVacancy().getEmployer().getId().equals(userPrincipal.getId()) && 
            !authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body("Access denied");
        }

        try {
            Application.ApplicationStatus newStatus = Application.ApplicationStatus.valueOf(request.get("status"));
            application.setStatus(newStatus);
            applicationRepository.save(application);

            return ResponseEntity.ok().body("Application status updated successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status value");
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('EMPLOYER') or hasRole('ADMIN')")
    public ResponseEntity<?> getApplicationStats(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        long totalApplications = applicationRepository.findByVacancyEmployerIdOrderByAppliedAtDesc(userPrincipal.getId()).size();
        long pendingApplications = applicationRepository.findByVacancyEmployerIdOrderByAppliedAtDesc(userPrincipal.getId())
                .stream()
                .filter(app -> app.getStatus() == Application.ApplicationStatus.PENDING)
                .count();

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalApplications", totalApplications);
        stats.put("pendingApplications", pendingApplications);

        return ResponseEntity.ok(stats);
    }
}