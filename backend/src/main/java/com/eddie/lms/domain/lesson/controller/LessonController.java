package com.eddie.lms.domain.lesson.controller;

import com.eddie.lms.domain.lesson.dto.request.*;
import com.eddie.lms.domain.lesson.dto.response.*;
import com.eddie.lms.domain.lesson.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 수업 관리 컨트롤러
 * 클래스룸별 수업 CRUD + 커리큘럼 관리 (진도 추적 기능 제거됨)
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms/{classroomId}/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    // ============================================================================
    // 수업 관리
    // ============================================================================

    /**
     * 새 수업 생성 (교육자만 가능)
     */
    @PostMapping
    public ResponseEntity<LessonResponse> createLesson(
            @PathVariable Long classroomId,
            @Valid @RequestBody LessonCreateRequest request) {

        log.info("POST /api/classrooms/{}/lessons - Creating lesson: {}", classroomId, request.getTitle());

        try {
            LessonResponse response = lessonService.createLesson(classroomId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Lesson creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lesson creation error: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 클래스룸 수업 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<LessonResponse>> getLessonsByClassroom(
            @PathVariable Long classroomId,
            @RequestParam Long userId) {

        log.info("GET /api/classrooms/{}/lessons - Fetching lessons for user: {}", classroomId, userId);

        try {
            List<LessonResponse> responses = lessonService.getLessonsByClassroom(classroomId, userId);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Failed to fetch lessons: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 수업 상세 조회
     */
    @GetMapping("/{lessonId}")
    public ResponseEntity<LessonResponse> getLessonDetail(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId,
            @RequestParam Long userId) {

        log.info("GET /api/classrooms/{}/lessons/{} - Fetching lesson for user: {}", classroomId, lessonId, userId);

        try {
            LessonResponse response = lessonService.getLessonDetail(classroomId, lessonId, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Lesson not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to fetch lesson: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 수업 정보 수정 (교육자만 가능)
     */
    @PutMapping("/{lessonId}")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonUpdateRequest request) {

        log.info("PUT /api/classrooms/{}/lessons/{} - Updating lesson", classroomId, lessonId);

        try {
            LessonResponse response = lessonService.updateLesson(classroomId, lessonId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Lesson update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Lesson update error: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 수업 삭제 (교육자만 가능)
     */
    @DeleteMapping("/{lessonId}")
    public ResponseEntity<Map<String, Object>> deleteLesson(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId) {

        log.info("DELETE /api/classrooms/{}/lessons/{} - Deleting lesson", classroomId, lessonId);

        try {
            lessonService.deleteLesson(classroomId, lessonId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "수업이 성공적으로 삭제되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            log.warn("Lesson deletion failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Lesson deletion error: ", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "수업 삭제 중 오류가 발생했습니다."
            ));
        }
    }

    // ============================================================================
    // 커리큘럼 관리
    // ============================================================================

    /**
     * 새 커리큘럼 생성 (교육자만 가능)
     */
    @PostMapping("/curriculums")
    public ResponseEntity<CurriculumResponse> createCurriculum(
            @PathVariable Long classroomId,
            @Valid @RequestBody CurriculumCreateRequest request) {

        log.info("POST /api/classrooms/{}/lessons/curriculums - Creating curriculum: {}",
                classroomId, request.getTitle());

        try {
            CurriculumResponse response = lessonService.createCurriculum(classroomId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Curriculum creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Curriculum creation error: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 클래스룸 커리큘럼 목록 조회
     */
    @GetMapping("/curriculums")
    public ResponseEntity<List<CurriculumResponse>> getCurriculumsByClassroom(
            @PathVariable Long classroomId) {

        log.info("GET /api/classrooms/{}/lessons/curriculums - Fetching curriculums", classroomId);

        try {
            List<CurriculumResponse> responses = lessonService.getCurriculumsByClassroom(classroomId);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Failed to fetch curriculums: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 커리큘럼 수정 (교육자만 가능)
     */
    @PutMapping("/curriculums/{curriculumId}")
    public ResponseEntity<CurriculumResponse> updateCurriculum(
            @PathVariable Long classroomId,
            @PathVariable Long curriculumId,
            @Valid @RequestBody CurriculumUpdateRequest request) {

        log.info("PUT /api/classrooms/{}/lessons/curriculums/{} - Updating curriculum",
                classroomId, curriculumId);

        try {
            CurriculumResponse response = lessonService.updateCurriculum(classroomId, curriculumId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Curriculum update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Curriculum update error: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 커리큘럼 삭제 (교육자만 가능)
     */
    @DeleteMapping("/curriculums/{curriculumId}")
    public ResponseEntity<Map<String, Object>> deleteCurriculum(
            @PathVariable Long classroomId,
            @PathVariable Long curriculumId) {

        log.info("DELETE /api/classrooms/{}/lessons/curriculums/{} - Deleting curriculum",
                classroomId, curriculumId);

        try {
            lessonService.deleteCurriculum(classroomId, curriculumId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "커리큘럼이 성공적으로 삭제되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            log.warn("Curriculum deletion failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Curriculum deletion error: ", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "커리큘럼 삭제 중 오류가 발생했습니다."
            ));
        }
    }
}