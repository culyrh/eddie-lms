package com.eddie.lms.domain.lesson.repository;

import com.eddie.lms.domain.lesson.entity.LearningMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 학습 자료 레포지토리
 */
@Repository
public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, Long> {

    /**
     * 수업별 학습 자료 조회
     */
    List<LearningMaterial> findByLessonLessonIdOrderByUploadedAtAsc(Long lessonId);

    /**
     * 특정 파일 타입의 자료 조회
     */
    List<LearningMaterial> findByLessonLessonIdAndFileTypeOrderByUploadedAtAsc(
            Long lessonId, String fileType);

    /**
     * 클래스룸의 모든 학습 자료 조회
     */
    @Query("SELECT lm FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "ORDER BY lm.uploadedAt DESC")
    List<LearningMaterial> findByClassroomId(@Param("classroomId") Long classroomId);

    /**
     * 자료 제목으로 검색
     */
    @Query("SELECT lm FROM LearningMaterial lm " +
            "WHERE lm.lesson.lessonId = :lessonId " +
            "AND LOWER(lm.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY lm.uploadedAt DESC")
    List<LearningMaterial> searchMaterials(@Param("lessonId") Long lessonId,
                                           @Param("keyword") String keyword);

    /**
     * 수업별 자료 개수 조회
     */
    long countByLessonLessonId(Long lessonId);

    /**
     * 클래스룸별 총 자료 개수
     */
    @Query("SELECT COUNT(lm) FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId")
    long countByClassroomId(@Param("classroomId") Long classroomId);

    /**
     * 클래스룸별 자료 타입 통계
     */
    @Query("SELECT lm.fileType, COUNT(lm) FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "GROUP BY lm.fileType " +
            "ORDER BY COUNT(lm) DESC")
    List<Object[]> getFileTypeStatistics(@Param("classroomId") Long classroomId);

    /**
     * 총 파일 크기 계산
     */
    @Query("SELECT SUM(lm.fileSize) FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId")
    Long getTotalFileSize(@Param("classroomId") Long classroomId);

    /**
     * 특정 크기 이상의 대용량 파일 조회
     */
    @Query("SELECT lm FROM LearningMaterial lm " +
            "WHERE lm.lesson.lessonId = :lessonId " +
            "AND lm.fileSize > :minSize " +
            "ORDER BY lm.fileSize DESC")
    List<LearningMaterial> findLargeFiles(@Param("lessonId") Long lessonId,
                                          @Param("minSize") Long minSize);
}