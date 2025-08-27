package com.eddie.lms.domain.lesson.repository;

import com.eddie.lms.domain.lesson.entity.LearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 학습 진도 레포지토리
 */
@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {

    /**
     * 사용자별 수업 진도 조회
     */
    Optional<LearningProgress> findByUserIdAndLessonLessonId(Long userId, Long lessonId);

    /**
     * 사용자별 클래스룸 전체 진도 조회
     */
    @Query("SELECT lp FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE lp.userId = :userId " +
            "AND l.classroomId = :classroomId " +
            "ORDER BY lp.lastAccessed DESC")
    List<LearningProgress> findByUserIdAndClassroomId(@Param("userId") Long userId,
                                                      @Param("classroomId") Long classroomId);

    /**
     * 수업별 모든 학생들의 진도 조회
     */
    List<LearningProgress> findByLessonLessonIdOrderByCompletionPercentageDesc(Long lessonId);

    /**
     * 클래스룸의 특정 사용자 평균 진도율 계산
     */
    @Query("SELECT AVG(lp.completionPercentage) FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE lp.userId = :userId " +
            "AND l.classroomId = :classroomId")
    BigDecimal getAverageProgressByUserAndClassroom(@Param("userId") Long userId,
                                                    @Param("classroomId") Long classroomId);

    /**
     * 클래스룸의 전체 평균 진도율 계산
     */
    @Query("SELECT AVG(lp.completionPercentage) FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE l.classroomId = :classroomId")
    BigDecimal getAverageProgressByClassroom(@Param("classroomId") Long classroomId);

    /**
     * 수업별 평균 진도율 계산
     */
    @Query("SELECT AVG(lp.completionPercentage) FROM LearningProgress lp " +
            "WHERE lp.lesson.lessonId = :lessonId")
    BigDecimal getAverageProgressByLesson(@Param("lessonId") Long lessonId);

    /**
     * 완료한 학생 수 조회
     */
    @Query("SELECT COUNT(lp) FROM LearningProgress lp " +
            "WHERE lp.lesson.lessonId = :lessonId " +
            "AND lp.completionPercentage = 100")
    long countCompletedStudents(@Param("lessonId") Long lessonId);

    /**
     * 시작한 학생 수 조회
     */
    @Query("SELECT COUNT(lp) FROM LearningProgress lp " +
            "WHERE lp.lesson.lessonId = :lessonId " +
            "AND lp.completionPercentage > 0")
    long countStartedStudents(@Param("lessonId") Long lessonId);

    /**
     * 특정 진도율 이상 학생 수 조회
     */
    @Query("SELECT COUNT(lp) FROM LearningProgress lp " +
            "WHERE lp.lesson.lessonId = :lessonId " +
            "AND lp.completionPercentage >= :minPercentage")
    long countStudentsAboveProgress(@Param("lessonId") Long lessonId,
                                    @Param("minPercentage") BigDecimal minPercentage);

    /**
     * 사용자의 최근 학습 활동 조회
     */
    @Query("SELECT lp FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE lp.userId = :userId " +
            "AND l.classroomId = :classroomId " +
            "ORDER BY lp.lastAccessed DESC " +
            "LIMIT :limit")
    List<LearningProgress> findRecentLearningActivity(@Param("userId") Long userId,
                                                      @Param("classroomId") Long classroomId,
                                                      @Param("limit") int limit);

    /**
     * 특정 기간 내 학습 활동 조회
     */
    @Query("SELECT lp FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "AND lp.lastAccessed BETWEEN :startDate AND :endDate " +
            "ORDER BY lp.lastAccessed DESC")
    List<LearningProgress> findProgressInDateRange(@Param("classroomId") Long classroomId,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);

    /**
     * 클래스룸별 학습 통계 (완료/진행중/미시작 학생 수)
     */
    @Query("SELECT " +
            "COUNT(CASE WHEN lp.completionPercentage = 100 THEN 1 END) as completed, " +
            "COUNT(CASE WHEN lp.completionPercentage > 0 AND lp.completionPercentage < 100 THEN 1 END) as inProgress, " +
            "COUNT(CASE WHEN lp.completionPercentage = 0 THEN 1 END) as notStarted " +
            "FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE l.classroomId = :classroomId")
    Object[] getProgressStatistics(@Param("classroomId") Long classroomId);

    /**
     * 가장 인기 있는 수업 조회 (높은 평균 진도율 순)
     */
    @Query("SELECT l.lessonId, l.title, AVG(lp.completionPercentage) as avgProgress " +
            "FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "GROUP BY l.lessonId, l.title " +
            "ORDER BY avgProgress DESC " +
            "LIMIT :limit")
    List<Object[]> findPopularLessons(@Param("classroomId") Long classroomId,
                                      @Param("limit") int limit);

    /**
     * 학습이 저조한 수업 조회 (낮은 평균 진도율 순)
     */
    @Query("SELECT l.lessonId, l.title, AVG(lp.completionPercentage) as avgProgress " +
            "FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "GROUP BY l.lessonId, l.title " +
            "ORDER BY avgProgress ASC " +
            "LIMIT :limit")
    List<Object[]> findLowProgressLessons(@Param("classroomId") Long classroomId,
                                          @Param("limit") int limit);

    /**
     * 사용자의 완료한 수업 개수 조회
     */
    @Query("SELECT COUNT(lp) FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE lp.userId = :userId " +
            "AND l.classroomId = :classroomId " +
            "AND lp.completionPercentage = 100")
    long countCompletedLessonsByUser(@Param("userId") Long userId,
                                     @Param("classroomId") Long classroomId);

    /**
     * 비활성 학습자 조회 (일정 기간 이상 접근하지 않은 사용자)
     */
    @Query("SELECT lp FROM LearningProgress lp " +
            "JOIN lp.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "AND lp.lastAccessed < :cutoffDate " +
            "AND lp.completionPercentage < 100 " +
            "ORDER BY lp.lastAccessed ASC")
    List<LearningProgress> findInactiveLearners(@Param("classroomId") Long classroomId,
                                                @Param("cutoffDate") LocalDateTime cutoffDate);
}