package com.eddie.lms.domain.progress.repository;

import com.eddie.lms.domain.progress.entity.LearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {

    /**
     * 특정 수업의 특정 사용자 진도율 조회
     */
    Optional<LearningProgress> findByLessonIdAndUserId(Long lessonId, Long userId);

    /**
     * 특정 사용자의 모든 진도율 조회
     */
    List<LearningProgress> findByUserId(Long userId);

    /**
     * 특정 수업의 모든 사용자 진도율 조회
     */
    List<LearningProgress> findByLessonId(Long lessonId);

    /**
     * 완료된 수업 개수 조회
     */
    @Query("SELECT COUNT(lp) FROM LearningProgress lp WHERE lp.userId = :userId AND lp.completedAt IS NOT NULL")
    Long countCompletedLessonsByUserId(@Param("userId") Long userId);

    /**
     * 특정 수업의 완료율 조회
     */
    @Query("SELECT COUNT(lp) * 1.0 / (SELECT COUNT(DISTINCT lp2.userId) FROM LearningProgress lp2 WHERE lp2.lessonId = :lessonId) " +
            "FROM LearningProgress lp WHERE lp.lessonId = :lessonId AND lp.completedAt IS NOT NULL")
    Double getCompletionRateByLessonId(@Param("lessonId") Long lessonId);
}