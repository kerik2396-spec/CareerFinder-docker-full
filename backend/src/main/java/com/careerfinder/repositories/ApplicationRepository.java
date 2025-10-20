package com.careerfinder.repositories;

import com.careerfinder.models.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    
    List<Application> findByApplicantIdOrderByAppliedAtDesc(Long applicantId);
    
    List<Application> findByVacancyIdOrderByAppliedAtDesc(Long vacancyId);
    
    List<Application> findByVacancyEmployerIdOrderByAppliedAtDesc(Long employerId);
    
    Optional<Application> findByVacancyIdAndApplicantId(Long vacancyId, Long applicantId);
    
    boolean existsByVacancyIdAndApplicantId(Long vacancyId, Long applicantId);
    
    @Query("SELECT COUNT(a) FROM Application a WHERE a.vacancy.id = :vacancyId")
    long countByVacancyId(@Param("vacancyId") Long vacancyId);
    
    @Query("SELECT COUNT(a) FROM Application a WHERE a.applicant.id = :applicantId")
    long countByApplicantId(@Param("applicantId") Long applicantId);
}