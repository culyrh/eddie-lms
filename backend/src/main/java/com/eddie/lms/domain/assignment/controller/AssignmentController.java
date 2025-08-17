package com.eddie.lms.domain.assignment.controller;

import com.eddie.lms.domain.assignment.entity.Assignment;
import com.eddie.lms.domain.assignment.entity.AssignmentSubmission;
import com.eddie.lms.domain.assignment.dto.request.AssignmentCreateRequest;
import com.eddie.lms.domain.assignment.dto.request.AssignmentUpdateRequest;
import com.eddie.lms.domain.assignment.dto.request.SubmissionCreateRequest;
import com.eddie.lms.domain.assignment.dto.request.SubmissionGradeRequest;
import com.eddie.lms.domain.assignment.dto.response.AssignmentResponse;
import com.eddie.lms.domain.assignment.dto.response.AssignmentDetailResponse;
import com.eddie.lms.domain.assignment.dto.response.SubmissionResponse;
import com.eddie.lms.domain.assignment.repository.AssignmentRepository;
import com.eddie.lms.domain.assignment.repository.AssignmentSubmissionRepository;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

/**
 * 과제 관리 컨트롤러
 * 클래스룸별 과제 CRUD + 제출/채점 기능
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms/{classroomId}/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    /**
     * 과제 생성 (교육자만 가능)
     */
    @PostMapping
    public ResponseEntity<AssignmentResponse> createAssignment(
            @PathVariable Long classroomId,
            @RequestBody AssignmentCreateRequest request,
            @RequestParam Long creatorId) {

        log.info("Creating assignment in classroom: {} by user: {}", classroomId, creatorId);

        // 교육자 권한 확인
        User creator = userRepository.findById(creatorId).orElse(null);
        if (creator == null || creator.getUserType() != User.UserType.EDUCATOR) {
            return ResponseEntity.badRequest().build();
        }

        // 과제 생성
        Assignment newAssignment = Assignment.builder()
                .classroomId(classroomId)
                .creatorId(creatorId)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .maxScore(request.getMaxScore())
                .build();

        Assignment savedAssignment = assignmentRepository.save(newAssignment);

        // 응답 생성
        AssignmentResponse response = convertToAssignmentResponse(savedAssignment, creator);

        log.info("Assignment created successfully: {}", savedAssignment.getAssignmentId());
        return ResponseEntity.ok(response);
    }

    /**
     * 클래스룸 과제 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getAssignments(@PathVariable Long classroomId) {
        log.info("Getting assignments for classroom: {}", classroomId);

        List<AssignmentResponse> responses = assignmentRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
                .map(assignment -> {
                    User creator = userRepository.findById(assignment.getCreatorId()).orElse(null);
                    return convertToAssignmentResponse(assignment, creator);
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 과제 상세 조회
     */
    @GetMapping("/{assignmentId}")
    public ResponseEntity<AssignmentDetailResponse> getAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestParam Long userId) {

        log.info("Getting assignment: {} by user: {}", assignmentId, userId);

        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);

        if (assignment == null || !assignment.getClassroomId().equals(classroomId)) {
            return ResponseEntity.notFound().build();
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }

        // 응답 생성
        AssignmentDetailResponse response = convertToAssignmentDetailResponse(assignment, user);

        return ResponseEntity.ok(response);
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

        log.info("Updating assignment: {} by user: {}", assignmentId, creatorId);

        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);

        if (assignment == null || !assignment.getClassroomId().equals(classroomId)) {
            return ResponseEntity.notFound().build();
        }

        // 작성자만 수정 가능
        if (!assignment.getCreatorId().equals(creatorId)) {
            return ResponseEntity.badRequest().build();
        }

        // 과제 수정
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxScore(request.getMaxScore());

        Assignment updatedAssignment = assignmentRepository.save(assignment);
        User creator = userRepository.findById(creatorId).orElse(null);

        AssignmentResponse response = convertToAssignmentResponse(updatedAssignment, creator);

        log.info("Assignment updated successfully: {}", assignmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * 과제 삭제 (교육자만 가능)
     */
    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestParam Long creatorId) {

        log.info("Deleting assignment: {} by user: {}", assignmentId, creatorId);

        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);

        if (assignment == null || !assignment.getClassroomId().equals(classroomId)) {
            return ResponseEntity.notFound().build();
        }

        // 작성자만 삭제 가능
        if (!assignment.getCreatorId().equals(creatorId)) {
            return ResponseEntity.badRequest().build();
        }

        // 과제와 관련 제출물 모두 삭제
        submissionRepository.deleteAll(submissionRepository.findByAssignmentId(assignmentId));
        assignmentRepository.delete(assignment);

        log.info("Assignment deleted successfully: {}", assignmentId);
        return ResponseEntity.ok().build();
    }

    /**
     * 과제 제출 (학습자)
     */
    @PostMapping("/{assignmentId}/submissions")
    public ResponseEntity<SubmissionResponse> submitAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestBody SubmissionCreateRequest request,
            @RequestParam Long studentId) {

        log.info("Submitting assignment: {} by student: {}", assignmentId, studentId);

        // 과제 존재 확인
        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        if (assignment == null || !assignment.getClassroomId().equals(classroomId)) {
            return ResponseEntity.notFound().build();
        }

        // 학습자 권한 확인
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null || student.getUserType() != User.UserType.LEARNER) {
            return ResponseEntity.badRequest().build();
        }

        // 이미 제출했는지 확인
        if (submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, studentId)) {
            return ResponseEntity.badRequest().build();
        }

        // 제출물 생성
        AssignmentSubmission newSubmission = AssignmentSubmission.builder()
                .assignmentId(assignmentId)
                .studentId(studentId)
                .submissionText(request.getSubmissionText())
                .fileUrl(request.getFileUrl())
                .submittedAt(LocalDateTime.now())
                .build();

        AssignmentSubmission savedSubmission = submissionRepository.save(newSubmission);

        // 응답 생성
        SubmissionResponse response = convertToSubmissionResponse(savedSubmission, assignment, student);

        log.info("Assignment submitted successfully: {}", savedSubmission.getSubmissionId());
        return ResponseEntity.ok(response);
    }

    /**
     * 과제 재제출 (학습자)
     */
    @PutMapping("/{assignmentId}/submissions")
    public ResponseEntity<SubmissionResponse> resubmitAssignment(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestBody SubmissionCreateRequest request,
            @RequestParam Long studentId) {

        log.info("Resubmitting assignment: {} by student: {}", assignmentId, studentId);

        // 기존 제출물 찾기
        AssignmentSubmission existingSubmission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId).orElse(null);

        if (existingSubmission == null) {
            return ResponseEntity.notFound().build();
        }

        // 제출물 수정
        existingSubmission.setSubmissionText(request.getSubmissionText());
        existingSubmission.setFileUrl(request.getFileUrl());
        existingSubmission.setSubmittedAt(LocalDateTime.now());
        // 재제출 시 채점 정보 초기화
        existingSubmission.setScore(null);
        existingSubmission.setFeedback(null);
        existingSubmission.setGradedAt(null);

        AssignmentSubmission updatedSubmission = submissionRepository.save(existingSubmission);

        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        User student = userRepository.findById(studentId).orElse(null);

        SubmissionResponse response = convertToSubmissionResponse(updatedSubmission, assignment, student);

        log.info("Assignment resubmitted successfully: {}", updatedSubmission.getSubmissionId());
        return ResponseEntity.ok(response);
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

        log.info("Grading submission: {} by grader: {}", submissionId, graderId);

        // 교육자 권한 확인
        User grader = userRepository.findById(graderId).orElse(null);
        if (grader == null || grader.getUserType() != User.UserType.EDUCATOR) {
            return ResponseEntity.badRequest().build();
        }

        // 제출물 찾기
        AssignmentSubmission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null || !submission.getAssignmentId().equals(assignmentId)) {
            return ResponseEntity.notFound().build();
        }

        // 채점 정보 업데이트
        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setGradedAt(LocalDateTime.now());

        AssignmentSubmission gradedSubmission = submissionRepository.save(submission);

        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        User student = userRepository.findById(submission.getStudentId()).orElse(null);

        SubmissionResponse response = convertToSubmissionResponse(gradedSubmission, assignment, student);

        log.info("Submission graded successfully: {}", submissionId);
        return ResponseEntity.ok(response);
    }

    /**
     * 내 제출물 조회 (학습자)
     */
    @GetMapping("/{assignmentId}/my-submission")
    public ResponseEntity<SubmissionResponse> getMySubmission(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @RequestParam Long studentId) {

        log.info("Getting my submission for assignment: {} by student: {}", assignmentId, studentId);

        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId).orElse(null);

        if (submission == null) {
            return ResponseEntity.notFound().build();
        }

        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        User student = userRepository.findById(studentId).orElse(null);

        SubmissionResponse response = convertToSubmissionResponse(submission, assignment, student);

        return ResponseEntity.ok(response);
    }

    // === 헬퍼 메서드들 ===

    private AssignmentResponse convertToAssignmentResponse(Assignment assignment, User creator) {
        int submissionCount = submissionRepository.countByAssignmentId(assignment.getAssignmentId());

        return AssignmentResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .classroomId(assignment.getClassroomId())
                .creatorId(assignment.getCreatorId())
                .creatorName(creator != null ? creator.getName() : "Unknown")
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .maxScore(assignment.getMaxScore())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .submissionCount(submissionCount)
                .isOverdue(LocalDateTime.now().isAfter(assignment.getDueDate()))
                .build();
    }

    private AssignmentDetailResponse convertToAssignmentDetailResponse(Assignment assignment, User requestUser) {
        User creator = userRepository.findById(assignment.getCreatorId()).orElse(null);
        int submissionCount = submissionRepository.countByAssignmentId(assignment.getAssignmentId());

        // 교육자인 경우에만 모든 제출물 정보 포함
        List<SubmissionResponse> submissionResponses = new ArrayList<>();
        if (requestUser.getUserType() == User.UserType.EDUCATOR) {
            submissionResponses = submissionRepository.findByAssignmentId(assignment.getAssignmentId()).stream()
                    .map(submission -> {
                        User student = userRepository.findById(submission.getStudentId()).orElse(null);
                        return convertToSubmissionResponse(submission, assignment, student);
                    })
                    .collect(Collectors.toList());
        }

        return AssignmentDetailResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .classroomId(assignment.getClassroomId())
                .creatorId(assignment.getCreatorId())
                .creatorName(creator != null ? creator.getName() : "Unknown")
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .maxScore(assignment.getMaxScore())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .submissionCount(submissionCount)
                .isOverdue(LocalDateTime.now().isAfter(assignment.getDueDate()))
                .submissions(submissionResponses)
                .build();
    }

    private SubmissionResponse convertToSubmissionResponse(AssignmentSubmission submission, Assignment assignment, User student) {
        return SubmissionResponse.builder()
                .submissionId(submission.getSubmissionId())
                .assignmentId(submission.getAssignmentId())
                .studentId(submission.getStudentId())
                .studentName(student != null ? student.getName() : "Unknown")
                .submissionText(submission.getSubmissionText())
                .fileUrl(submission.getFileUrl())
                .score(submission.getScore())
                .feedback(submission.getFeedback())
                .submittedAt(submission.getSubmittedAt())
                .gradedAt(submission.getGradedAt())
                .isLate(assignment != null && submission.isLate(assignment.getDueDate()))
                .isGraded(submission.isGraded())
                .build();
    }
}