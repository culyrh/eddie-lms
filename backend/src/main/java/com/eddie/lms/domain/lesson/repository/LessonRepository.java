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
     * 클래스룸별 수업 통계 조회 (단순화됨)
     */
    @Query("SELECT " +
            "COUNT(l) as totalLessons, " +
            "SUM(CASE WHEN l.lessonType = 'VIDEO' THEN 1 ELSE 0 END) as videoLessons, " +
            "SUM(CASE WHEN l.lessonType = 'DOCUMENT' THEN 1 ELSE 0 END) as documentLessons " +
            "FROM Lesson l WHERE l.classroomId = :classroomId")
    Object[] getLessonStatistics(@Param("classroomId") Long classroomId);

    /**
     * 커리큘럼별 수업 개수 조회
     */
    long countByCurriculumId(Long curriculumId);

    /**
     * 클래스룸의 전체 수업 개수 조회
     */
    long countByClassroomId(Long classroomId);

    /**
     * 특정 유형의 수업 개수 조회
     */
    long countByClassroomIdAndLessonType(Long classroomId, Lesson.LessonType lessonType);

    /**
     * 최근 생성된 수업 조회
     */
    @Query("SELECT l FROM Lesson l WHERE l.classroomId = :classroomId " +
            "ORDER BY l.createdAt DESC LIMIT 5")
    List<Lesson> findRecentLessons(@Param("classroomId") Long classroomId);

    /**
     * 수업이 존재하는지 확인
     */
    boolean existsByLessonIdAndClassroomId(Long lessonId, Long classroomId);
}