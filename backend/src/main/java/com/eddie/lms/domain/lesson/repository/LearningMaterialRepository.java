package com.eddie.lms.domain.lesson.repository;

import com.eddie.lms.domain.lesson.entity.LearningMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, Long> {

    /**
     * 특정 수업의 학습자료 목록을 업로드 시간 순으로 조회
     */
    List<LearningMaterial> findByLessonLessonIdOrderByUploadedAtAsc(Long lessonId);

    /**
     * 특정 수업의 학습자료 목록을 업로드 시간 역순으로 조회
     */
    List<LearningMaterial> findByLessonLessonIdOrderByUploadedAtDesc(Long lessonId);

    /**
     * 클래스룸의 모든 학습자료 조회
     */
    @Query("SELECT lm FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "ORDER BY lm.uploadedAt DESC")
    List<LearningMaterial> findByClassroomId(@Param("classroomId") Long classroomId);

    /**
     * 파일 타입별 학습자료 조회
     */
    List<LearningMaterial> findByLessonLessonIdAndFileTypeOrderByUploadedAtDesc(
            Long lessonId, String fileType);

    /**
     * 제목으로 학습자료 검색
     */
    List<LearningMaterial> findByLessonLessonIdAndTitleContainingIgnoreCaseOrderByUploadedAtDesc(
            Long lessonId, String title);

    /**
     * 파일명으로 학습자료 검색
     */
    List<LearningMaterial> findByLessonLessonIdAndFileNameContainingIgnoreCaseOrderByUploadedAtDesc(
            Long lessonId, String fileName);

    /**
     * 특정 수업의 학습자료 개수 조회
     */
    long countByLessonLessonId(Long lessonId);

    /**
     * 특정 클래스룸의 전체 학습자료 개수 조회
     */
    @Query("SELECT COUNT(lm) FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId")
    long countByClassroomId(@Param("classroomId") Long classroomId);

    /**
     * 특정 수업에서 파일 경로로 학습자료 존재 여부 확인
     */
    boolean existsByLessonLessonIdAndFilePath(Long lessonId, String filePath);

    /**
     * 특정 수업의 특정 파일 타입 학습자료 개수
     */
    long countByLessonLessonIdAndFileType(Long lessonId, String fileType);

    /**
     * 특정 클래스룸의 총 파일 크기 조회
     */
    @Query("SELECT COALESCE(SUM(lm.fileSize), 0) FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId")
    Long getTotalFileSize(@Param("classroomId") Long classroomId);

    /**
     * 클래스룸의 파일 타입별 통계 조회
     */
    @Query("SELECT lm.fileType, COUNT(lm), COALESCE(SUM(lm.fileSize), 0) " +
            "FROM LearningMaterial lm " +
            "JOIN lm.lesson l " +
            "WHERE l.classroomId = :classroomId " +
            "GROUP BY lm.fileType " +
            "ORDER BY COUNT(lm) DESC")
    List<Object[]> getFileTypeStatistics(@Param("classroomId") Long classroomId);
}