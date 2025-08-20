package com.eddie.lms.domain.assignment.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 과제 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    /**
     * 과제 생성 (교육자만 가능)
     */
    @Transactional
    public AssignmentResponse createAssignment(Long classroomId, Long creatorId, AssignmentCreateRequest request) {
        log.info("Creating assignment in classroom: {} by user: {}", classroomId, creatorId);

        // 교육자 권한 확인
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (creator.getUserType() != User.UserType.EDUCATOR) {
            throw new IllegalArgumentException("교육자만 과제를 생성할 수 있습니다.");
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

        log.info("Assignment created successfully: {}", savedAssignment.getAssignmentId());
        return convertToAssignmentResponse(savedAssignment, creator);
    }

    /**
     * 클래스룸 과제 목록 조회
     */
    public List<AssignmentResponse> getAssignments(Long classroomId) {
        log.info("Getting assignments for classroom: {}", classroomId);

        return assignmentRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
                .map(assignment -> {
                    User creator = userRepository.findById(assignment.getCreatorId()).orElse(null);
                    return convertToAssignmentResponse(assignment, creator);
                })
                .collect(Collectors.toList());
    }

    /**
     * 특정 과제 상세 조회
     */
    public AssignmentDetailResponse getAssignment(Long classroomId, Long assignmentId, Long userId) {
        log.info("Getting assignment: {} by user: {}", assignmentId, userId);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("과제를 찾을 수 없습니다."));

        if (!assignment.getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸의 과제가 아닙니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return convertToAssignmentDetailResponse(assignment, user);
    }

    /**
     * 과제 수정 (교육자만 가능)
     */
    @Transactional
    public AssignmentResponse updateAssignment(Long classroomId, Long assignmentId, Long creatorId, AssignmentUpdateRequest request) {
        log.info("Updating assignment: {} by user: {}", assignmentId, creatorId);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("과제를 찾을 수 없습니다."));

        if (!assignment.getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸의 과제가 아닙니다.");
        }

        // 작성자만 수정 가능
        if (!assignment.getCreatorId().equals(creatorId)) {
            throw new IllegalArgumentException("과제 수정 권한이 없습니다.");
        }

        // 과제 정보 수정
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxScore(request.getMaxScore());

        Assignment updatedAssignment = assignmentRepository.save(assignment);
        User creator = userRepository.findById(creatorId).orElse(null);

        log.info("Assignment updated successfully: {}", assignmentId);
        return convertToAssignmentResponse(updatedAssignment, creator);
    }

    /**
     * 과제 삭제 (교육자만 가능)
     */
    @Transactional
    public void deleteAssignment(Long classroomId, Long assignmentId, Long creatorId) {
        log.info("Deleting assignment: {} by user: {}", assignmentId, creatorId);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("과제를 찾을 수 없습니다."));

        if (!assignment.getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸의 과제가 아닙니다.");
        }

        // 작성자만 삭제 가능
        if (!assignment.getCreatorId().equals(creatorId)) {
            throw new IllegalArgumentException("과제 삭제 권한이 없습니다.");
        }

        assignmentRepository.delete(assignment);
        log.info("Assignment deleted successfully: {}", assignmentId);
    }

    /**
     * 과제 제출
     */
    @Transactional
    public SubmissionResponse submitAssignment(Long classroomId, Long assignmentId, Long studentId, SubmissionCreateRequest request) {
        log.info("Submitting assignment: {} by student: {}", assignmentId, studentId);

        // 과제 존재 확인
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("과제를 찾을 수 없습니다."));

        if (!assignment.getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸의 과제가 아닙니다.");
        }

        // 학습자 권한 확인
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (student.getUserType() != User.UserType.LEARNER) {
            throw new IllegalArgumentException("학습자만 과제를 제출할 수 있습니다.");
        }

        // 이미 제출한 과제인지 확인
        if (submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, studentId)) {
            throw new IllegalArgumentException("이미 제출한 과제입니다.");
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

        log.info("Assignment submitted successfully: {}", savedSubmission.getSubmissionId());
        return convertToSubmissionResponse(savedSubmission, assignment, student);
    }

    /**
     * 과제 재제출
     */
    @Transactional
    public SubmissionResponse resubmitAssignment(Long classroomId, Long assignmentId, Long studentId, SubmissionCreateRequest request) {
        log.info("Resubmitting assignment: {} by student: {}", assignmentId, studentId);

        // 기존 제출물 찾기
        AssignmentSubmission existingSubmission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new IllegalArgumentException("제출물을 찾을 수 없습니다."));

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

        log.info("Assignment resubmitted successfully: {}", updatedSubmission.getSubmissionId());
        return convertToSubmissionResponse(updatedSubmission, assignment, student);
    }

    /**
     * 과제 채점 (교육자만 가능)
     */
    @Transactional
    public SubmissionResponse gradeSubmission(Long classroomId, Long assignmentId, Long submissionId, Long graderId, SubmissionGradeRequest request) {
        log.info("Grading submission: {} by grader: {}", submissionId, graderId);

        // 교육자 권한 확인
        User grader = userRepository.findById(graderId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (grader.getUserType() != User.UserType.EDUCATOR) {
            throw new IllegalArgumentException("교육자만 채점할 수 있습니다.");
        }

        // 제출물 찾기
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("제출물을 찾을 수 없습니다."));

        if (!submission.getAssignmentId().equals(assignmentId)) {
            throw new IllegalArgumentException("해당 과제의 제출물이 아닙니다.");
        }

        // 채점 정보 업데이트
        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setGradedAt(LocalDateTime.now());

        AssignmentSubmission gradedSubmission = submissionRepository.save(submission);

        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        User student = userRepository.findById(submission.getStudentId()).orElse(null);

        log.info("Submission graded successfully: {}", submissionId);
        return convertToSubmissionResponse(gradedSubmission, assignment, student);
    }

    /**
     * 학생의 특정 과제 제출물 조회
     */
    public SubmissionResponse getMySubmission(Long classroomId, Long assignmentId, Long studentId) {
        log.info("Getting submission for assignment: {} by student: {}", assignmentId, studentId);

        // 과제 존재 확인
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("과제를 찾을 수 없습니다."));

        if (!assignment.getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸의 과제가 아닙니다.");
        }

        // 제출물 조회
        AssignmentSubmission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(null);

        if (submission == null) {
            return null; // 제출물이 없는 경우
        }

        User student = userRepository.findById(studentId).orElse(null);
        return convertToSubmissionResponse(submission, assignment, student);
    }

    /**
     * Assignment 엔티티를 AssignmentResponse DTO로 변환
     */
    private AssignmentResponse convertToAssignmentResponse(Assignment assignment, User creator) {
        int submissionCount = submissionRepository.countByAssignmentId(assignment.getAssignmentId());

        return AssignmentResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .classroomId(assignment.getClassroomId())
                .creatorId(assignment.getCreatorId())
                .creatorName(creator != null ? creator.getName() : "알 수 없음")
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

    /**
     * Assignment 엔티티를 AssignmentDetailResponse DTO로 변환
     */
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
                .creatorName(creator != null ? creator.getName() : "알 수 없음")
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

    /**
     * AssignmentSubmission 엔티티를 SubmissionResponse DTO로 변환
     */
    private SubmissionResponse convertToSubmissionResponse(AssignmentSubmission submission, Assignment assignment, User student) {
        return SubmissionResponse.builder()
                .submissionId(submission.getSubmissionId())
                .assignmentId(submission.getAssignmentId())
                .studentId(submission.getStudentId())
                .studentName(student != null ? student.getName() : "알 수 없음")
                .submissionText(submission.getSubmissionText())
                .fileUrl(submission.getFileUrl())
                .submittedAt(submission.getSubmittedAt())
                .score(submission.getScore())
                .feedback(submission.getFeedback())
                .gradedAt(submission.getGradedAt())
                .isLate(assignment != null && submission.getSubmittedAt().isAfter(assignment.getDueDate()))
                .build();
    }
}