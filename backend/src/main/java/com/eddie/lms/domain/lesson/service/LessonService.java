package com.eddie.lms.domain.lesson.service;

import com.eddie.lms.domain.lesson.dto.request.*;
import com.eddie.lms.domain.lesson.dto.response.*;
import com.eddie.lms.domain.lesson.entity.*;
import com.eddie.lms.domain.lesson.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 수업 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CurriculumRepository curriculumRepository;
    private final LearningMaterialRepository learningMaterialRepository;

    // ============================================================================
    // 수업 관리
    // ============================================================================

    /**
     * 새 수업 생성
     */
    @Transactional
    public LessonResponse createLesson(Long classroomId, LessonCreateRequest request) {
        log.info("Creating lesson: {} for classroom: {}", request.getTitle(), classroomId);

        // 커리큘럼 유효성 검사
        if (request.getCurriculumId() != null) {
            validateCurriculumExists(request.getCurriculumId(), classroomId);
        }

        // 수업 엔티티 생성
        Lesson lesson = Lesson.builder()
                .classroomId(classroomId)
                .curriculumId(request.getCurriculumId())
                .title(request.getTitle())
                .description(request.getDescription())
                .lessonType(request.getLessonType())
                .build();

        lesson = lessonRepository.save(lesson);

        log.info("Lesson created successfully with ID: {}", lesson.getLessonId());
        return convertToLessonResponse(lesson);
    }

    /**
     * 수업 정보 수정
     */
    @Transactional
    public LessonResponse updateLesson(Long classroomId, Long lessonId, LessonUpdateRequest request) {
        log.info("Updating lesson: {} for classroom: {}", lessonId, classroomId);

        Lesson lesson = findLessonByIdAndClassroom(lessonId, classroomId);

        // 커리큘럼 유효성 검사
        if (request.getCurriculumId() != null) {
            validateCurriculumExists(request.getCurriculumId(), classroomId);
        }

        // 수업 정보 업데이트
        lesson.updateInfo(
                request.getTitle(),
                request.getDescription(),
                request.getLessonType()
        );

        if (request.getCurriculumId() != null) {
            lesson.setCurriculumId(request.getCurriculumId());
        }

        lesson = lessonRepository.save(lesson);
        log.info("Lesson updated successfully: {}", lessonId);

        return convertToLessonResponse(lesson);
    }

    /**
     * 수업 삭제
     */
    @Transactional
    public void deleteLesson(Long classroomId, Long lessonId) {
        log.info("Deleting lesson: {} from classroom: {}", lessonId, classroomId);

        Lesson lesson = findLessonByIdAndClassroom(lessonId, classroomId);
        lessonRepository.delete(lesson);

        log.info("Lesson deleted successfully: {}", lessonId);
    }

    /**
     * 클래스룸의 모든 수업 조회
     */
    public List<LessonResponse> getLessonsByClassroom(Long classroomId, Long userId) {
        log.info("Fetching lessons for classroom: {} by user: {}", classroomId, userId);

        List<Lesson> lessons = lessonRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId);

        return lessons.stream()
                .map(this::convertToLessonResponse)
                .collect(Collectors.toList());
    }

    /**
     * 특정 수업 상세 조회
     */
    public LessonResponse getLessonDetail(Long classroomId, Long lessonId, Long userId) {
        log.info("Fetching lesson detail: {} for user: {}", lessonId, userId);

        Lesson lesson = findLessonByIdAndClassroom(lessonId, classroomId);
        return convertToLessonResponse(lesson);
    }

    // ============================================================================
    // 커리큘럼 관리
    // ============================================================================

    /**
     * 새 커리큘럼 생성
     */
    @Transactional
    public CurriculumResponse createCurriculum(Long classroomId, CurriculumCreateRequest request) {
        log.info("Creating curriculum: {} for classroom: {}", request.getTitle(), classroomId);

        // 제목 중복 검사
        if (curriculumRepository.existsByClassroomIdAndTitle(classroomId, request.getTitle())) {
            throw new IllegalArgumentException("이미 존재하는 커리큘럼 제목입니다.");
        }

        // 순서 설정 (지정하지 않으면 마지막에 추가)
        Integer orderIndex = request.getOrderIndex();
        if (orderIndex == null) {
            Integer maxOrder = curriculumRepository.findMaxOrderIndexByClassroomId(classroomId);
            orderIndex = (maxOrder != null ? maxOrder : -1) + 1;
        }

        Curriculum curriculum = Curriculum.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(orderIndex)
                .build();

        curriculum = curriculumRepository.save(curriculum);
        log.info("Curriculum created successfully with ID: {}", curriculum.getCurriculumId());

        return convertToCurriculumResponse(curriculum);
    }

    /**
     * 커리큘럼 정보 수정
     */
    @Transactional
    public CurriculumResponse updateCurriculum(Long classroomId, Long curriculumId, CurriculumUpdateRequest request) {
        log.info("Updating curriculum: {} for classroom: {}", curriculumId, classroomId);

        Curriculum curriculum = findCurriculumByIdAndClassroom(curriculumId, classroomId);

        // 제목 중복 검사 (자기 자신 제외)
        if (request.getTitle() != null &&
                curriculumRepository.existsByClassroomIdAndTitleAndCurriculumIdNot(
                        classroomId, request.getTitle(), curriculumId)) {
            throw new IllegalArgumentException("이미 존재하는 커리큘럼 제목입니다.");
        }

        curriculum.updateInfo(request.getTitle(), request.getDescription(), request.getOrderIndex());
        curriculum = curriculumRepository.save(curriculum);

        log.info("Curriculum updated successfully: {}", curriculumId);
        return convertToCurriculumResponse(curriculum);
    }

    /**
     * 커리큘럼 삭제
     */
    @Transactional
    public void deleteCurriculum(Long classroomId, Long curriculumId) {
        log.info("Deleting curriculum: {} from classroom: {}", curriculumId, classroomId);

        Curriculum curriculum = findCurriculumByIdAndClassroom(curriculumId, classroomId);

        // 커리큘럼에 속한 수업들의 curriculumId를 null로 변경
        List<Lesson> lessons = lessonRepository.findByCurriculumIdOrderByCreatedAtAsc(curriculumId);
        lessons.forEach(lesson -> lesson.setCurriculumId(null));
        lessonRepository.saveAll(lessons);

        curriculumRepository.delete(curriculum);
        log.info("Curriculum deleted successfully: {}", curriculumId);
    }

    /**
     * 클래스룸의 모든 커리큘럼 조회
     */
    public List<CurriculumResponse> getCurriculumsByClassroom(Long classroomId) {
        log.info("Fetching curriculums for classroom: {}", classroomId);

        List<Curriculum> curriculums = curriculumRepository.findByClassroomIdOrderByOrderIndexAsc(classroomId);

        return curriculums.stream()
                .map(this::convertToCurriculumResponse)
                .collect(Collectors.toList());
    }

    // ============================================================================
    // 유틸리티 메서드
    // ============================================================================

    private Lesson findLessonByIdAndClassroom(Long lessonId, Long classroomId) {
        return lessonRepository.findByLessonIdAndClassroomId(lessonId, classroomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 클래스룸에서 수업을 찾을 수 없습니다."));
    }

    private Curriculum findCurriculumByIdAndClassroom(Long curriculumId, Long classroomId) {
        Curriculum curriculum = curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new IllegalArgumentException("커리큘럼을 찾을 수 없습니다."));

        if (!curriculum.getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸의 커리큘럼이 아닙니다.");
        }

        return curriculum;
    }

    private void validateCurriculumExists(Long curriculumId, Long classroomId) {
        if (!curriculumRepository.existsByCurriculumIdAndClassroomId(curriculumId, classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸에서 커리큘럼을 찾을 수 없습니다.");
        }
    }

    // ============================================================================
    // 변환 메서드 (단순화됨)
    // ============================================================================

    /**
     * 수업 엔티티를 응답 DTO로 변환 (진도 추적 기능 제거됨)
     */
    private LessonResponse convertToLessonResponse(Lesson lesson) {
        LessonResponse response = LessonResponse.builder()
                .lessonId(lesson.getLessonId())
                .curriculumId(lesson.getCurriculumId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .lessonType(lesson.getLessonType())
                .lessonTypeName(lesson.getLessonType().getDisplayName())
                .status("활성") // 단순한 상태
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();

        // 커리큘럼 정보 추가
        if (lesson.getCurriculum() != null) {
            response.setCurriculumTitle(lesson.getCurriculum().getTitle());
        }

        // 선택적: 기본 통계 정보
        response.setTotalMaterials(learningMaterialRepository.countByLessonLessonId(lesson.getLessonId()));

        return response;
    }

    private CurriculumResponse convertToCurriculumResponse(Curriculum curriculum) {
        // 포함된 수업들
        List<Lesson> lessons = lessonRepository.findByCurriculumIdOrderByCreatedAtAsc(curriculum.getCurriculumId());
        List<LessonResponse> lessonResponses = lessons.stream()
                .map(this::convertToLessonResponse)
                .collect(Collectors.toList());

        return CurriculumResponse.builder()
                .curriculumId(curriculum.getCurriculumId())
                .title(curriculum.getTitle())
                .description(curriculum.getDescription())
                .orderIndex(curriculum.getOrderIndex())
                .createdAt(curriculum.getCreatedAt())
                .updatedAt(curriculum.getUpdatedAt())
                .lessonCount(lessons.size())
                .lessons(lessonResponses)
                .build();
    }

    // StorageStatistics DTO (그대로 유지)
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class StorageStatistics {
        private Long totalFileCount;
        private Long totalFileSize;
        private List<Object[]> fileTypeStatistics;

        public String getFormattedTotalSize() {
            return formatFileSize(totalFileSize);
        }

        private String formatFileSize(long bytes) {
            if (bytes == 0) return "0 B";

            String[] units = {"B", "KB", "MB", "GB", "TB"};
            int unitIndex = 0;
            double size = bytes;

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            return String.format("%.1f %s", size, units[unitIndex]);
        }
    }
}