package com.careerfinder.repositories;

import com.careerfinder.models.Vacancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VacancyRepository extends JpaRepository<Vacancy, Long> {
    
    List<Vacancy> findByIsActiveTrueOrderByCreatedAtDesc();
    
    List<Vacancy> findByEmployerIdOrderByCreatedAtDesc(Long employerId);
    
    List<Vacancy> findByIsActiveTrueAndTitleContainingIgnoreCase(String title);
    
    List<Vacancy> findByIsActiveTrueAndLocationContainingIgnoreCase(String location);
    
    @Query("SELECT v FROM Vacancy v WHERE v.isActive = true AND " +
           "(LOWER(v.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.skills) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Vacancy> searchActiveVacancies(@Param("query") String query);
    
    List<Vacancy> findByIsActiveTrueAndEmploymentType(Vacancy.EmploymentType employmentType);
    
    List<Vacancy> findByIsActiveTrueAndExperienceLevel(Vacancy.ExperienceLevel experienceLevel);
    
    long countByIsActiveTrue();
}