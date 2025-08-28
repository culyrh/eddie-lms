package com.eddie.lms.domain.lesson.repository;

import com.eddie.lms.domain.lesson.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    /**
     * 클래스룸별 수업 목록 조회 (생성일 순)
     */
    List<Lesson> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);

    /**
     * 특정 커리큘럼의 수업 목록 조회 (생성일순으로 변경)
     */
    List<Lesson> findByCurriculumIdOrderByCreatedAtAsc(Long curriculumId);

    /**
     * 클래스룸의 특정 유형 수업 조회
     */
    List<Lesson> findByClassroomIdAndLessonTypeOrderByCreatedAtAsc(Long classroomId, Lesson.LessonType lessonType);

    /**
     * 완료된 수업 개수 조회
     */
    long countByClassroomIdAndIsCompleted(Long classroomId, Boolean isCompleted);

    /**
     * 특정 수업이 클래스룸에 속하는지 확인
     */
    Optional<Lesson> findByLessonIdAndClassroomId(Long lessonId, Long classroomId);

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
     * 클래스룸별 수업 통계 조회 (실시간 관련 제거)
     */
    @Query("SELECT " +
            "COUNT(l) as totalLessons, " +
            "SUM(CASE WHEN l.isCompleted = true THEN 1 ELSE 0 END) as completedLessons, " +
            "SUM(CASE WHEN l.lessonType = 'VIDEO' THEN 1 ELSE 0 END) as videoLessons, " +
            "SUM(CASE WHEN l.lessonType = 'DOCUMENT' THEN 1 ELSE 0 END) as documentLessons " +
            "FROM Lesson l WHERE l.classroomId = :classroomId")
    Object[] getLessonStatistics(@Param("classroomId") Long classroomId);

    /**
     * 평균 수업 시간 (제거 - duration 필드 없음)
     */
    @Query("SELECT 0.0 FROM Lesson l WHERE l.classroomId = :classroomId")
    Double getAverageDuration(@Param("classroomId") Long classroomId);
}