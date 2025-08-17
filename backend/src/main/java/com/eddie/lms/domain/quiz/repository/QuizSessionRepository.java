package com.eddie.lms.domain.quiz.repository;

import com.eddie.lms.domain.quiz.entity.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {

    Optional<QuizSession> findByQuizIdAndStudentId(Long quizId, Long studentId);

    Optional<QuizSession> findBySessionToken(String sessionToken);

    boolean existsByQuizIdAndStudentId(Long quizId, Long studentId);

    List<QuizSession> findByStudentIdAndSessionStatus(Long studentId, QuizSession.SessionStatus status);

    @Query("SELECT qs FROM QuizSession qs WHERE qs.sessionStatus IN ('STARTED', 'IN_PROGRESS') AND qs.startTime < :expiredTime")
    List<QuizSession> findExpiredSessions(@Param("expiredTime") LocalDateTime expiredTime);

    @Modifying
    @Transactional
    @Query("UPDATE QuizSession qs SET qs.sessionStatus = 'EXPIRED', qs.endTime = :now WHERE qs.sessionId IN :sessionIds")
    void expireSessions(@Param("sessionIds") List<Long> sessionIds, @Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE QuizSession qs SET qs.tabSwitchCount = qs.tabSwitchCount + 1 WHERE qs.sessionToken = :sessionToken")
    void incrementTabSwitchCount(@Param("sessionToken") String sessionToken);

    @Modifying
    @Transactional
    @Query("UPDATE QuizSession qs SET qs.violationCount = qs.violationCount + 1 WHERE qs.sessionToken = :sessionToken")
    void incrementViolationCount(@Param("sessionToken") String sessionToken);

    @Modifying
    @Transactional
    @Query("UPDATE QuizSession qs SET qs.warningCount = qs.warningCount + 1 WHERE qs.sessionToken = :sessionToken")
    void incrementWarningCount(@Param("sessionToken") String sessionToken);
}