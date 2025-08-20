package com.eddie.lms.domain.assignment.controller;

import com.eddie.lms.domain.assignment.dto.request.AssignmentCreateRequest;
import com.eddie.lms.domain.assignment.dto.request.AssignmentUpdateRequest;
import com.eddie.lms.domain.assignment.dto.request.SubmissionCreateRequest;
import com.eddie.lms.domain.assignment.dto.request.SubmissionGradeRequest;
import com.eddie.lms.domain.assignment.dto.response.AssignmentResponse;
import com.eddie.lms.domain.assignment.dto.response.AssignmentDetailResponse;
import com.eddie.lms.domain.assignment.dto.response.SubmissionResponse;
import com.eddie.lms.domain.assignment.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 과제 관리 컨트롤러
 * 클래스룸별 과제 CRUD + 제출/채점 기능
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms/{classroomId}/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * 과제 생성 (교육자만 가능)
     */
    @PostMapping
    public ResponseEntity<AssignmentResponse> createAssignment(
            @PathVariable Long classroomId,
            @RequestBody AssignmentCreateRequest request,
            @RequestParam Long creatorId) {

        log.info("POST /api/classrooms/{}/assignments - creator: {}", classroomId, creatorId);

        try {
            AssignmentResponse response = assignmentService.createAssignment(classroomId, creatorId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to create assignment in classroom: {} by user: {}", classroomId, creatorId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 클래스룸 과제 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getAssignments(@PathVariable Long classroomId) {
        log.info("GET /api/classrooms/{}/assignments", classroomId);

        try {
            List<AssignmentResponse> assignments = assignmentService.getAssignments(classroomId);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            log.error("Failed to get assignments for classroom: {}", classroomId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 과제 상세 조회
     */
    @GetMapping("/{assignmentId}")
    public ResponseEntity<AssignmentDetailResponse> getAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestParam Long userId) {

        log.info("GET /api/classrooms/{}/assignments/{} - user: {}", classroomId, assignmentId, userId);

        try {
            AssignmentDetailResponse assignment = assignmentService.getAssignment(classroomId, assignmentId, userId);
            return ResponseEntity.ok(assignment);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to get assignment: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to get assignment: {} in classroom: {} by user: {}", assignmentId, classroomId, userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 과제 수정 (교육자만 가능)
     */
    @PutMapping("/{assignmentId}")
    public ResponseEntity<AssignmentResponse> updateAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestBody AssignmentUpdateRequest request,
            @RequestParam Long creatorId) {

        log.info("PUT /api/classrooms/{}/assignments/{} - creator: {}", classroomId, assignmentId, creatorId);

        try {
            AssignmentResponse response = assignmentService.updateAssignment(classroomId, assignmentId, creatorId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to update assignment: {} in classroom: {} by user: {}", assignmentId, classroomId, creatorId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 과제 삭제 (교육자만 가능)
     */
    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestParam Long creatorId) {

        log.info("DELETE /api/classrooms/{}/assignments/{} - creator: {}", classroomId, assignmentId, creatorId);

        try {
            assignmentService.deleteAssignment(classroomId, assignmentId, creatorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to delete assignment: {} in classroom: {} by user: {}", assignmentId, classroomId, creatorId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 과제 제출 (학습자만 가능)
     * URL: POST /api/classrooms/{classroomId}/assignments/{assignmentId}/submissions
     */
    @PostMapping("/{assignmentId}/submissions")
    public ResponseEntity<SubmissionResponse> submitAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestBody SubmissionCreateRequest request,
            @RequestParam Long studentId) {

        log.info("POST /api/classrooms/{}/assignments/{}/submissions - student: {}", classroomId, assignmentId, studentId);

        try {
            SubmissionResponse response = assignmentService.submitAssignment(classroomId, assignmentId, studentId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to submit assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to submit assignment: {} in classroom: {} by student: {}", assignmentId, classroomId, studentId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 과제 재제출 (학습자만 가능)
     * URL: PUT /api/classrooms/{classroomId}/assignments/{assignmentId}/submissions
     */
    @PutMapping("/{assignmentId}/submissions")
    public ResponseEntity<SubmissionResponse> resubmitAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestBody SubmissionCreateRequest request,
            @RequestParam Long studentId) {

        log.info("PUT /api/classrooms/{}/assignments/{}/submissions - student: {}", classroomId, assignmentId, studentId);

        try {
            SubmissionResponse response = assignmentService.resubmitAssignment(classroomId, assignmentId, studentId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to resubmit assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to resubmit assignment: {} in classroom: {} by student: {}", assignmentId, classroomId, studentId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 과제 채점 (교육자만 가능)
     */
    @PutMapping("/{assignmentId}/submissions/{submissionId}/grade")
    public ResponseEntity<SubmissionResponse> gradeSubmission(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @PathVariable Long submissionId,
            @RequestBody SubmissionGradeRequest request,
            @RequestParam Long graderId) {

        log.info("PUT /api/classrooms/{}/assignments/{}/submissions/{}/grade - grader: {}",
                classroomId, assignmentId, submissionId, graderId);

        try {
            SubmissionResponse response = assignmentService.gradeSubmission(classroomId, assignmentId, submissionId, graderId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to grade submission: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to grade submission: {} for assignment: {} in classroom: {} by grader: {}",
                    submissionId, assignmentId, classroomId, graderId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 학생의 특정 과제 제출물 조회
     */
    @GetMapping("/{assignmentId}/my-submission")
    public ResponseEntity<SubmissionResponse> getMySubmission(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestParam Long studentId) {

        log.info("GET /api/classrooms/{}/assignments/{}/my-submission - student: {}", classroomId, assignmentId, studentId);

        try {
            SubmissionResponse submission = assignmentService.getMySubmission(classroomId, assignmentId, studentId);
            if (submission == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(submission);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to get submission: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to get submission for assignment: {} in classroom: {} by student: {}",
                    assignmentId, classroomId, studentId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}