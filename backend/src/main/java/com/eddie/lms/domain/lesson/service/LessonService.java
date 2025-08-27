package com.eddie.lms.domain.lesson.service;

import com.eddie.lms.domain.lesson.dto.request.*;
import com.eddie.lms.domain.lesson.dto.response.*;
import com.eddie.lms.domain.lesson.entity.*;
import com.eddie.lms.domain.lesson.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final LearningProgressRepository learningProgressRepository;

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
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes())
                .isCompleted(false)
                .build();

        lesson = lessonRepository.save(lesson);

        // 학습 자료 추가
        if (request.getMaterials() != null && !request.getMaterials().isEmpty()) {
            addMaterialsToLesson(lesson, request.getMaterials());
        }

        log.info("Lesson created successfully with ID: {}", lesson.getLessonId());
        return convertToLessonResponse(lesson, null);
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
                request.getLessonType(),
                request.getScheduledAt(),
                request.getDurationMinutes()
        );

        if (request.getCurriculumId() != null) {
            lesson.setCurriculumId(request.getCurriculumId());
        }

        if (request.getIsCompleted() != null) {
            lesson.setIsCompleted(request.getIsCompleted());
        }

        // 학습 자료 업데이트
        if (request.getMaterials() != null) {
            updateLessonMaterials(lesson, request.getMaterials());
        }

        lesson = lessonRepository.save(lesson);
        log.info("Lesson updated successfully: {}", lessonId);

        return convertToLessonResponse(lesson, null);
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
                .map(lesson -> convertToLessonResponse(lesson, userId))
                .collect(Collectors.toList());
    }

    /**
     * 특정 수업 상세 조회
     */
    public LessonResponse getLessonDetail(Long classroomId, Long lessonId, Long userId) {
        log.info("Fetching lesson detail: {} for user: {}", lessonId, userId);

        Lesson lesson = findLessonByIdAndClassroom(lessonId, classroomId);
        return convertToLessonResponse(lesson, userId);
    }

    /**
     * 수업 완료 상태 변경
     */
    @Transactional
    public LessonResponse toggleLessonCompletion(Long classroomId, Long lessonId) {
        log.info("Toggling completion status for lesson: {}", lessonId);

        Lesson lesson = findLessonByIdAndClassroom(lessonId, classroomId);
        lesson.toggleCompletion();
        lesson = lessonRepository.save(lesson);

        return convertToLessonResponse(lesson, null);
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
        List<Lesson> lessons = lessonRepository.findByCurriculumIdOrderByScheduledAtAsc(curriculumId);
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
    // 학습 진도 관리
    // ============================================================================

    /**
     * 학습 진도 업데이트
     */
    @Transactional
    public LearningProgressResponse updateLearningProgress(Long classroomId, Long lessonId,
                                                           Long userId, LearningProgressUpdateRequest request) {
        log.info("Updating learning progress for lesson: {} by user: {}", lessonId, userId);

        // 수업 존재 확인
        findLessonByIdAndClassroom(lessonId, classroomId);

        // 기존 진도 조회 또는 새로 생성
        LearningProgress progress = learningProgressRepository
                .findByUserIdAndLessonLessonId(userId, lessonId)
                .orElseGet(() -> {
                    Lesson lesson = lessonRepository.findById(lessonId)
                            .orElseThrow(() -> new IllegalArgumentException("수업을 찾을 수 없습니다."));

                    return LearningProgress.builder()
                            .userId(userId)
                            .lesson(lesson)
                            .completionPercentage(BigDecimal.ZERO)
                            .build();
                });

        progress.updateProgress(request.getCompletionPercentage());
        progress = learningProgressRepository.save(progress);

        return convertToLearningProgressResponse(progress);
    }

    /**
     * 사용자의 학습 진도 조회
     */
    public LearningProgressResponse getLearningProgress(Long classroomId, Long lessonId, Long userId) {
        log.info("Fetching learning progress for lesson: {} by user: {}", lessonId, userId);

        // 수업 존재 확인
        findLessonByIdAndClassroom(lessonId, classroomId);

        LearningProgress progress = learningProgressRepository
                .findByUserIdAndLessonLessonId(userId, lessonId)
                .orElse(null);

        if (progress == null) {
            // 진도 기록이 없으면 0% 상태로 반환
            return LearningProgressResponse.builder()
                    .userId(userId)
                    .lessonId(lessonId)
                    .completionPercentage(BigDecimal.ZERO)
                    .progressStatus("미시작")
                    .isCompleted(false)
                    .isStarted(false)
                    .build();
        }

        return convertToLearningProgressResponse(progress);
    }

    /**
     * 수업별 전체 학습 진도 통계 조회 (교육자용)
     */
    public LessonResponse.LessonProgressInfo getLessonProgressStatistics(Long classroomId, Long lessonId) {
        log.info("Fetching progress statistics for lesson: {}", lessonId);

        // 수업 존재 확인
        findLessonByIdAndClassroom(lessonId, classroomId);

        List<LearningProgress> allProgress = learningProgressRepository.findByLessonLessonIdOrderByCompletionPercentageDesc(lessonId);
        long totalStudents = allProgress.size();
        long completedStudents = learningProgressRepository.countCompletedStudents(lessonId);
        long startedStudents = learningProgressRepository.countStartedStudents(lessonId);
        BigDecimal averageProgress = learningProgressRepository.getAverageProgressByLesson(lessonId);

        LessonResponse.LessonProgressInfo progressInfo = new LessonResponse.LessonProgressInfo();
        progressInfo.setTotalStudents(totalStudents);
        progressInfo.setCompletedStudents(completedStudents);
        progressInfo.setStartedStudents(startedStudents);
        progressInfo.setAverageProgress(averageProgress != null ? averageProgress.doubleValue() : 0.0);
        progressInfo.setCompletionRate(totalStudents > 0 ? (completedStudents * 100 / totalStudents) : 0);

        return progressInfo;
    }

    // ============================================================================
    // 통계 및 검색
    // ============================================================================

    /**
     * 클래스룸 수업 통계 조회
     */
    public LessonStatisticsResponse getClassroomLessonStatistics(Long classroomId) {
        log.info("Fetching lesson statistics for classroom: {}", classroomId);

        // 기본 수업 통계
        Object[] lessonStats = lessonRepository.getLessonStatistics(classroomId);
        Long totalLessons = (Long) lessonStats[0];
        Long completedLessons = (Long) lessonStats[1];
        Long videoLessons = (Long) lessonStats[2];
        Long documentLessons = (Long) lessonStats[3];

        Double averageDuration = lessonRepository.getAverageDuration(classroomId);
        Long totalMaterials = learningMaterialRepository.countByClassroomId(classroomId);
        Long totalFileSize = learningMaterialRepository.getTotalFileSize(classroomId);

        // 진도 통계
        Object[] progressStats = learningProgressRepository.getProgressStatistics(classroomId);
        Long completedStudentsCount = (Long) progressStats[0];
        Long inProgressStudentsCount = (Long) progressStats[1];
        Long notStartedStudentsCount = (Long) progressStats[2];
        Long totalStudents = completedStudentsCount + inProgressStudentsCount + notStartedStudentsCount;

        BigDecimal overallProgress = learningProgressRepository.getAverageProgressByClassroom(classroomId);

        // 인기 수업 및 저조한 수업
        List<Object[]> popularLessonsData = learningProgressRepository.findPopularLessons(classroomId, 5);
        List<Object[]> lowProgressLessonsData = learningProgressRepository.findLowProgressLessons(classroomId, 5);

        return LessonStatisticsResponse.builder()
                .totalLessons(totalLessons)
                .completedLessons(completedLessons)
                .videoLessons(videoLessons)
                .documentLessons(documentLessons)
                .averageDuration(averageDuration)
                .totalMaterials(totalMaterials)
                .totalFileSize(totalFileSize)
                .totalStudents(totalStudents)
                .activeStudents(inProgressStudentsCount + completedStudentsCount)
                .overallProgress(overallProgress != null ? overallProgress.doubleValue() : 0.0)
                .completedStudentsCount(completedStudentsCount)
                .inProgressStudentsCount(inProgressStudentsCount)
                .notStartedStudentsCount(notStartedStudentsCount)
                .popularLessons(convertToPopularLessonInfo(popularLessonsData))
                .lowProgressLessons(convertToPopularLessonInfo(lowProgressLessonsData))
                .build();
    }

    /**
     * 수업 검색
     */
    public List<LessonResponse> searchLessons(Long classroomId, String keyword, Long userId) {
        log.info("Searching lessons in classroom: {} with keyword: {}", classroomId, keyword);

        List<Lesson> lessons = lessonRepository.searchLessons(classroomId, keyword);

        return lessons.stream()
                .map(lesson -> convertToLessonResponse(lesson, userId))
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

    private void addMaterialsToLesson(Lesson lesson, List<LearningMaterialCreateRequest> materialRequests) {
        for (LearningMaterialCreateRequest materialRequest : materialRequests) {
            LearningMaterial material = LearningMaterial.builder()
                    .lesson(lesson)
                    .title(materialRequest.getTitle())
                    .fileName(materialRequest.getFileName())
                    .filePath(materialRequest.getFilePath() != null ? materialRequest.getFilePath() : "")
                    .fileType(materialRequest.getFileType())
                    .fileSize(materialRequest.getFileSize() != null ? materialRequest.getFileSize() : 0L)
                    .build();

            lesson.addMaterial(material);
        }
    }

    private void updateLessonMaterials(Lesson lesson, List<LearningMaterialCreateRequest> materialRequests) {
        // 기존 자료 삭제
        lesson.getMaterials().clear();

        // 새 자료 추가
        if (!materialRequests.isEmpty()) {
            addMaterialsToLesson(lesson, materialRequests);
        }
    }

    // ============================================================================
    // 변환 메서드
    // ============================================================================

    private LessonResponse convertToLessonResponse(Lesson lesson, Long userId) {
        // 학습 자료 변환
        List<LearningMaterialResponse> materials = lesson.getMaterials().stream()
                .map(this::convertToLearningMaterialResponse)
                .collect(Collectors.toList());

        // 커리큘럼 정보
        String curriculumTitle = null;
        if (lesson.getCurriculumId() != null) {
            curriculumTitle = curriculumRepository.findById(lesson.getCurriculumId())
                    .map(Curriculum::getTitle)
                    .orElse(null);
        }

        LessonResponse response = new LessonResponse();
        response.setLessonId(lesson.getLessonId());
        response.setCurriculumId(lesson.getCurriculumId());
        response.setCurriculumTitle(curriculumTitle);
        response.setTitle(lesson.getTitle());
        response.setDescription(lesson.getDescription());
        response.setLessonType(lesson.getLessonType());
        response.setLessonTypeName(lesson.getLessonType().getDisplayName());
        response.setScheduledAt(lesson.getScheduledAt());
        response.setDurationMinutes(lesson.getDurationMinutes());
        response.setIsCompleted(lesson.getIsCompleted());
        response.setStatus(lesson.getStatus());
        response.setCreatedAt(lesson.getCreatedAt());
        response.setUpdatedAt(lesson.getUpdatedAt());
        response.setMaterials(materials);

        // 개인 학습 진도 추가 (학습자용)
        if (userId != null) {
            LearningProgress progress = learningProgressRepository
                    .findByUserIdAndLessonLessonId(userId, lesson.getLessonId())
                    .orElse(null);

            if (progress != null) {
                LessonResponse.PersonalProgressInfo personalProgress = new LessonResponse.PersonalProgressInfo();
                personalProgress.setCompletionPercentage(progress.getProgressAsDouble());
                personalProgress.setLastAccessed(progress.getLastAccessed());
                personalProgress.setCompletedAt(progress.getCompletedAt());
                personalProgress.setProgressStatus(progress.getProgressStatus());
                personalProgress.setIsAccessible(lesson.canStart());
                response.setPersonalProgress(personalProgress);
            } else {
                LessonResponse.PersonalProgressInfo personalProgress = new LessonResponse.PersonalProgressInfo();
                personalProgress.setCompletionPercentage(0.0);
                personalProgress.setProgressStatus("미시작");
                personalProgress.setIsAccessible(lesson.canStart());
                response.setPersonalProgress(personalProgress);
            }
        } else {
            // 교육자용 - 전체 진도 통계
            LessonResponse.LessonProgressInfo progressInfo = getLessonProgressStatistics(
                    lesson.getClassroomId(), lesson.getLessonId());
            response.setProgressInfo(progressInfo);
        }

        return response;
    }

    private LearningMaterialResponse convertToLearningMaterialResponse(LearningMaterial material) {
        return LearningMaterialResponse.builder()
                .materialId(material.getMaterialId())
                .title(material.getTitle())
                .fileName(material.getFileName())
                .filePath(material.getFilePath())
                .fileType(material.getFileType())
                .fileSize(material.getFileSize())
                .formattedFileSize(material.getFormattedFileSize())
                .uploadedAt(material.getUploadedAt())
                .iconClass(material.getIconClass())
                .isDownloadable(material.isDownloadable())
                .build();
    }

    private CurriculumResponse convertToCurriculumResponse(Curriculum curriculum) {
        // 포함된 수업들
        List<Lesson> lessons = lessonRepository.findByCurriculumIdOrderByScheduledAtAsc(curriculum.getCurriculumId());
        List<LessonResponse> lessonResponses = lessons.stream()
                .map(lesson -> convertToLessonResponse(lesson, null))
                .collect(Collectors.toList());

        // 다음 수업
        LessonResponse nextLesson = null;
        Lesson nextLessonEntity = curriculum.getNextLesson();
        if (nextLessonEntity != null) {
            nextLesson = convertToLessonResponse(nextLessonEntity, null);
        }

        return CurriculumResponse.builder()
                .curriculumId(curriculum.getCurriculumId())
                .title(curriculum.getTitle())
                .description(curriculum.getDescription())
                .orderIndex(curriculum.getOrderIndex())
                .createdAt(curriculum.getCreatedAt())
                .updatedAt(curriculum.getUpdatedAt())
                .lessonCount(curriculum.getLessonCount())
                .completedLessonCount(curriculum.getCompletedLessonCount())
                .progressPercentage(curriculum.getProgressPercentage())
                .totalDurationMinutes(curriculum.getTotalDurationMinutes())
                .lessons(lessonResponses)
                .nextLesson(nextLesson)
                .build();
    }

    private LearningProgressResponse convertToLearningProgressResponse(LearningProgress progress) {
        return LearningProgressResponse.builder()
                .progressId(progress.getProgressId())
                .userId(progress.getUserId())
                .lessonId(progress.getLesson().getLessonId())
                .lessonTitle(progress.getLesson().getTitle())
                .completionPercentage(progress.getCompletionPercentage())
                .lastAccessed(progress.getLastAccessed())
                .completedAt(progress.getCompletedAt())
                .createdAt(progress.getCreatedAt())
                .updatedAt(progress.getUpdatedAt())
                .progressStatus(progress.getProgressStatus())
                .isCompleted(progress.isCompleted())
                .isStarted(progress.isStarted())
                .daysSinceLastAccess(progress.getDaysSinceLastAccess())
                .learningDurationHours(progress.getLearningDurationHours())
                .isRecentlyAccessed(progress.isRecentlyAccessed())
                .build();
    }

    private List<LessonStatisticsResponse.PopularLessonInfo> convertToPopularLessonInfo(List<Object[]> data) {
        return data.stream()
                .map(row -> LessonStatisticsResponse.PopularLessonInfo.builder()
                        .lessonId((Long) row[0])
                        .title((String) row[1])
                        .averageProgress(((BigDecimal) row[2]).doubleValue())
                        .build())
                .collect(Collectors.toList());
    }
}