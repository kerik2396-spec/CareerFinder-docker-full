package com.careerfinder.controllers;

import com.careerfinder.dto.CreateVacancyRequest;
import com.careerfinder.dto.VacancyDto;
import com.careerfinder.models.User;
import com.careerfinder.models.Vacancy;
import com.careerfinder.repositories.UserRepository;
import com.careerfinder.repositories.VacancyRepository;
import com.careerfinder.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vacancies")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class VacancyController {

    private final VacancyRepository vacancyRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllActiveVacancies() {
        List<Vacancy> vacancies = vacancyRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        List<VacancyDto> vacancyDtos = vacancies.stream()
                .map(VacancyDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(vacancyDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVacancyById(@PathVariable Long id) {
        Optional<Vacancy> vacancy = vacancyRepository.findById(id);
        if (vacancy.isPresent() && vacancy.get().getIsActive()) {
            return ResponseEntity.ok(new VacancyDto(vacancy.get()));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchVacancies(@RequestParam String query) {
        List<Vacancy> vacancies = vacancyRepository.searchActiveVacancies(query);
        List<VacancyDto> vacancyDtos = vacancies.stream()
                .map(VacancyDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(vacancyDtos);
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterVacancies(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Vacancy.EmploymentType employmentType,
            @RequestParam(required = false) Vacancy.ExperienceLevel experienceLevel) {
        
        List<Vacancy> vacancies;
        
        if (location != null) {
            vacancies = vacancyRepository.findByIsActiveTrueAndLocationContainingIgnoreCase(location);
        } else if (employmentType != null) {
            vacancies = vacancyRepository.findByIsActiveTrueAndEmploymentType(employmentType);
        } else if (experienceLevel != null) {
            vacancies = vacancyRepository.findByIsActiveTrueAndExperienceLevel(experienceLevel);
        } else {
            vacancies = vacancyRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        }
        
        List<VacancyDto> vacancyDtos = vacancies.stream()
                .map(VacancyDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(vacancyDtos);
    }

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER') or hasRole('ADMIN')")
    public ResponseEntity<?> createVacancy(@Valid @RequestBody CreateVacancyRequest request, 
                                         Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Optional<User> employer = userRepository.findById(userPrincipal.getId());
        
        if (employer.isEmpty()) {
            return ResponseEntity.badRequest().body("Employer not found");
        }

        Vacancy vacancy = new Vacancy();
        vacancy.setTitle(request.getTitle());
        vacancy.setDescription(request.getDescription());
        vacancy.setCompanyName(request.getCompanyName());
        vacancy.setCompanyLogo(request.getCompanyLogo());
        vacancy.setLocation(request.getLocation());
        vacancy.setSalary(request.getSalary());
        vacancy.setEmploymentType(request.getEmploymentType());
        vacancy.setExperienceLevel(request.getExperienceLevel());
        vacancy.setSkills(request.getSkills());
        vacancy.setContactEmail(request.getContactEmail());
        vacancy.setWebsite(request.getWebsite());
        vacancy.setEmployer(employer.get());

        Vacancy savedVacancy = vacancyRepository.save(vacancy);
        return ResponseEntity.ok(new VacancyDto(savedVacancy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateVacancy(@PathVariable Long id,
                                         @Valid @RequestBody CreateVacancyRequest request,
                                         Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Optional<Vacancy> existingVacancy = vacancyRepository.findById(id);
        
        if (existingVacancy.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Vacancy vacancy = existingVacancy.get();
        
        // Проверяем, что пользователь является владельцем вакансии или админом
        if (!vacancy.getEmployer().getId().equals(userPrincipal.getId()) && 
            !authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body("Access denied");
        }

        vacancy.setTitle(request.getTitle());
        vacancy.setDescription(request.getDescription());
        vacancy.setCompanyName(request.getCompanyName());
        vacancy.setCompanyLogo(request.getCompanyLogo());
        vacancy.setLocation(request.getLocation());
        vacancy.setSalary(request.getSalary());
        vacancy.setEmploymentType(request.getEmploymentType());
        vacancy.setExperienceLevel(request.getExperienceLevel());
        vacancy.setSkills(request.getSkills());
        vacancy.setContactEmail(request.getContactEmail());
        vacancy.setWebsite(request.getWebsite());

        Vacancy updatedVacancy = vacancyRepository.save(vacancy);
        return ResponseEntity.ok(new VacancyDto(updatedVacancy));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteVacancy(@PathVariable Long id, Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Optional<Vacancy> vacancy = vacancyRepository.findById(id);
        
        if (vacancy.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Проверяем права доступа
        if (!vacancy.get().getEmployer().getId().equals(userPrincipal.getId()) && 
            !authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body("Access denied");
        }

        vacancyRepository.delete(vacancy.get());
        return ResponseEntity.ok().body("Vacancy deleted successfully");
    }

    @GetMapping("/employer/my-vacancies")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getMyVacancies(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        List<Vacancy> vacancies = vacancyRepository.findByEmployerIdOrderByCreatedAtDesc(userPrincipal.getId());
        List<VacancyDto> vacancyDtos = vacancies.stream()
                .map(VacancyDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(vacancyDtos);
    }

    @GetMapping("/stats/count")
    public ResponseEntity<?> getActiveVacanciesCount() {
        long count = vacancyRepository.countByIsActiveTrue();
        return ResponseEntity.ok(count);
    }
}
// Добавим метод для получения детальной информации о вакансии
@GetMapping("/{id}/detailed")
public ResponseEntity<?> getVacancyDetailed(@PathVariable Long id) {
    Optional<Vacancy> vacancy = vacancyRepository.findById(id);
    if (vacancy.isEmpty() || !vacancy.get().getIsActive()) {
        return ResponseEntity.notFound().build();
    }

    // Получаем дополнительные данные
    Vacancy vacancyData = vacancy.get();
    Map<String, Object> response = new HashMap<>();
    response.put("vacancy", new VacancyDto(vacancyData));
    
    // Счетчик просмотров (можно добавить позже)
    response.put("views", 0);
    
    // Похожие вакансии
    List<Vacancy> similarVacancies = vacancyRepository
        .findByIsActiveTrueAndTitleContainingIgnoreCaseOrSkillsContainingIgnoreCase(
            vacancyData.getTitle().split(" ")[0], 
            vacancyData.getSkills() != null ? vacancyData.getSkills().split(",")[0] : ""
        ).stream()
        .filter(v -> !v.getId().equals(id))
        .limit(4)
        .collect(Collectors.toList());
    
    response.put("similarVacancies", similarVacancies.stream()
        .map(VacancyDto::new)
        .collect(Collectors.toList()));

    return ResponseEntity.ok(response);
}