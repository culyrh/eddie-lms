package com.eddie.lms.domain.lesson.repository;

import com.eddie.lms.domain.lesson.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 수업 레포지토리
 */
@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    /**
     * 클래스룸별 수업 목록 조회 (생성일 순)
     */
    List<Lesson> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);

    /**
     * 클래스룸별 수업 목록 조회 (예정일 순)
     */
    List<Lesson> findByClassroomIdOrderByScheduledAtAsc(Long classroomId);

    /**
     * 특정 커리큘럼의 수업 목록 조회
     */
    List<Lesson> findByCurriculumIdOrderByScheduledAtAsc(Long curriculumId);

    /**
     * 클래스룸의 특정 유형 수업 조회
     */
    List<Lesson> findByClassroomIdAndLessonTypeOrderByScheduledAtAsc(Long classroomId, Lesson.LessonType lessonType);

    /**
     * 완료된 수업 개수 조회
     */
    long countByClassroomIdAndIsCompleted(Long classroomId, Boolean isCompleted);

    /**
     * 특정 기간 내 수업 조회
     */
    @Query("SELECT l FROM Lesson l WHERE l.classroomId = :classroomId " +
            "AND l.scheduledAt BETWEEN :startDate AND :endDate " +
            "ORDER BY l.scheduledAt ASC")
    List<Lesson> findLessonsByDateRange(@Param("classroomId") Long classroomId,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);

    /**
     * 오늘 예정된 수업 조회
     */
    @Query("SELECT l FROM Lesson l WHERE l.classroomId = :classroomId " +
            "AND CAST(l.scheduledAt AS date) = CURRENT_DATE " +
            "ORDER BY l.scheduledAt ASC")
    List<Lesson> findTodaysLessons(@Param("classroomId") Long classroomId);

    /**
     * 곧 시작될 수업 조회 (예정된 수업)
     */
    @Query("SELECT l FROM Lesson l WHERE l.classroomId = :classroomId " +
            "AND l.scheduledAt > :now " +
            "AND l.scheduledAt <= :futureTime " +
            "ORDER BY l.scheduledAt ASC")
    List<Lesson> findUpcomingLessons(@Param("classroomId") Long classroomId,
                                     @Param("now") LocalDateTime now,
                                     @Param("futureTime") LocalDateTime futureTime);

    /**
     * 수업 제목으로 검색
     */
    @Query("SELECT l FROM Lesson l WHERE l.classroomId = :classroomId " +
            "AND (LOWER(l.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(l.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY l.createdAt DESC")
    List<Lesson> searchLessons(@Param("classroomId") Long classroomId,
                               @Param("keyword") String keyword);

    /**
     * 클래스룸별 수업 통계 조회
     */
    @Query("SELECT " +
            "COUNT(l) as totalLessons, " +
            "SUM(CASE WHEN l.isCompleted = true THEN 1 ELSE 0 END) as completedLessons, " +
            "SUM(CASE WHEN l.lessonType = 'VIDEO' THEN 1 ELSE 0 END) as videoLessons, " +
            "SUM(CASE WHEN l.lessonType = 'DOCUMENT' THEN 1 ELSE 0 END) as documentLessons " +
            "FROM Lesson l WHERE l.classroomId = :classroomId")
    Object[] getLessonStatistics(@Param("classroomId") Long classroomId);

    /**
     * 특정 사용자가 접근 가능한 수업 조회 (권한 체크용)
     */
    @Query("SELECT l FROM Lesson l " +
            "WHERE l.lessonId = :lessonId " +
            "AND l.classroomId = :classroomId")
    Optional<Lesson> findByLessonIdAndClassroomId(@Param("lessonId") Long lessonId,
                                                  @Param("classroomId") Long classroomId);

    /**
     * 커리큘럼에 속하지 않은 수업들 조회
     */
    List<Lesson> findByClassroomIdAndCurriculumIdIsNullOrderByCreatedAtDesc(Long classroomId);

    /**
     * 최근 업데이트된 수업 조회
     */
    List<Lesson> findByClassroomIdOrderByUpdatedAtDescCreatedAtDesc(Long classroomId);

    /**
     * 특정 날짜 이후 생성된 수업 조회
     */
    List<Lesson> findByClassroomIdAndCreatedAtAfterOrderByCreatedAtDesc(Long classroomId, LocalDateTime createdAfter);

    /**
     * 수업 존재 여부 확인
     */
    boolean existsByLessonIdAndClassroomId(Long lessonId, Long classroomId);

    /**
     * 클래스룸의 다음 수업 조회 (미완료 중 가장 빠른 예정일)
     */
    @Query("SELECT l FROM Lesson l WHERE l.classroomId = :classroomId " +
            "AND l.isCompleted = false " +
            "AND l.scheduledAt > :now " +
            "ORDER BY l.scheduledAt ASC " +
            "LIMIT 1")
    Optional<Lesson> findNextLesson(@Param("classroomId") Long classroomId,
                                    @Param("now") LocalDateTime now);

    /**
     * 평균 수업 시간 계산
     */
    @Query("SELECT AVG(l.durationMinutes) FROM Lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "AND l.durationMinutes IS NOT NULL")
    Double getAverageDuration(@Param("classroomId") Long classroomId);
}