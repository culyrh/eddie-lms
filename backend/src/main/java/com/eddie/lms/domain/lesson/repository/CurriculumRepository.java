package com.eddie.lms.domain.lesson.repository;

import com.eddie.lms.domain.lesson.entity.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 커리큘럼 레포지토리
 */
@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {

    /**
     * 클래스룸별 커리큘럼 목록 조회 (순서대로)
     */
    List<Curriculum> findByClassroomIdOrderByOrderIndexAsc(Long classroomId);

    /**
     * 클래스룸별 커리큘럼 목록 조회 (생성일 순)
     */
    List<Curriculum> findByClassroomIdOrderByCreatedAtAsc(Long classroomId);

    /**
     * 특정 클래스룸의 커리큘럼 개수
     */
    long countByClassroomId(Long classroomId);

    /**
     * 커리큘럼 존재 여부 확인
     */
    boolean existsByCurriculumIdAndClassroomId(Long curriculumId, Long classroomId);

    /**
     * 특정 클래스룸에서 가장 높은 order_index 조회
     */
    @Query("SELECT MAX(c.orderIndex) FROM Curriculum c WHERE c.classroomId = :classroomId")
    Integer findMaxOrderIndexByClassroomId(@Param("classroomId") Long classroomId);

    /**
     * 커리큘럼 제목으로 검색
     */
    @Query("SELECT c FROM Curriculum c WHERE c.classroomId = :classroomId " +
            "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY c.orderIndex ASC")
    List<Curriculum> searchCurriculums(@Param("classroomId") Long classroomId,
                                       @Param("keyword") String keyword);

    /**
     * 특정 순서의 커리큘럼 조회
     */
    Optional<Curriculum> findByClassroomIdAndOrderIndex(Long classroomId, Integer orderIndex);

    /**
     * 특정 순서 이후의 커리큘럼들 조회
     */
    List<Curriculum> findByClassroomIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(
            Long classroomId, Integer orderIndex);

    /**
     * 제목 중복 체크
     */
    boolean existsByClassroomIdAndTitleAndCurriculumIdNot(Long classroomId, String title, Long curriculumId);

    /**
     * 새로운 커리큘럼의 경우 제목 중복 체크
     */
    boolean existsByClassroomIdAndTitle(Long classroomId, String title);
}