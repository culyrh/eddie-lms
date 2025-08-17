package com.eddie.lms.domain.quiz.controller;

import com.eddie.lms.domain.quiz.dto.request.QuizCreateRequest;
import com.eddie.lms.domain.quiz.dto.request.QuizSubmitRequest;
import com.eddie.lms.domain.quiz.dto.request.QuizUpdateRequest;
import com.eddie.lms.domain.quiz.dto.response.*;
import com.eddie.lms.domain.quiz.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 퀴즈 관리 컨트롤러
 * 클래스룸별 퀴즈 CRUD + 퀴즈 응시/채점 기능
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms/{classroomId}/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    /**
     * 퀴즈 생성 (교육자만 가능)
     */
    @PostMapping
    public ResponseEntity<QuizResponse> createQuiz(
            @PathVariable Long classroomId,
            @RequestBody QuizCreateRequest request,
            @RequestParam Long creatorId) {

        QuizResponse response = quizService.createQuiz(classroomId, request, creatorId);
        return ResponseEntity.ok(response);
    }

    /**
     * 클래스룸 퀴즈 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<QuizResponse>> getQuizzes(
            @PathVariable Long classroomId,
            @RequestParam Long userId) {

        List<QuizResponse> responses = quizService.getQuizzes(classroomId, userId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 퀴즈 상세 조회
     */
    @GetMapping("/{quizId}")
    public ResponseEntity<QuizDetailResponse> getQuiz(
            @PathVariable Long classroomId,
            @PathVariable Long quizId,
            @RequestParam Long userId) {

        QuizDetailResponse response = quizService.getQuizDetail(classroomId, quizId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 퀴즈 수정 (교육자만 가능)
     */
    @PutMapping("/{quizId}")
    public ResponseEntity<QuizResponse> updateQuiz(
            @PathVariable Long classroomId,
            @PathVariable Long quizId,
            @RequestBody QuizUpdateRequest request,
            @RequestParam Long creatorId) {

        QuizResponse response = quizService.updateQuiz(classroomId, quizId, request, creatorId);
        return ResponseEntity.ok(response);
    }

    /**
     * 퀴즈 삭제 (교육자만 가능)
     */
    @DeleteMapping("/{quizId}")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long classroomId,
            @PathVariable Long quizId,
            @RequestParam Long creatorId) {

        quizService.deleteQuiz(classroomId, quizId, creatorId);
        return ResponseEntity.ok().build();
    }

    /**
     * 퀴즈 응시 (학습자)
     */
    @PostMapping("/{quizId}/submit")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @PathVariable Long classroomId,
            @PathVariable Long quizId,
            @RequestBody QuizSubmitRequest request,
            @RequestParam Long studentId) {

        QuizResultResponse result = quizService.submitQuiz(classroomId, quizId, request, studentId);
        return ResponseEntity.ok(result);
    }

    /**
     * 퀴즈 결과 조회 (학습자 본인 결과)
     */
    @GetMapping("/{quizId}/my-result")
    public ResponseEntity<QuizResultResponse> getMyQuizResult(
            @PathVariable Long classroomId,
            @PathVariable Long quizId,
            @RequestParam Long studentId) {

        QuizResultResponse result = quizService.getMyQuizResult(classroomId, quizId, studentId);

        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }

    /**
     * 퀴즈 전체 결과 조회 (교육자용)
     */
    @GetMapping("/{quizId}/results")
    public ResponseEntity<QuizResultSummaryResponse> getQuizResultsSummary(
            @PathVariable Long classroomId,
            @PathVariable Long quizId,
            @RequestParam Long requestUserId) {

        QuizResultSummaryResponse response = quizService.getQuizResultsSummary(classroomId, quizId, requestUserId);
        return ResponseEntity.ok(response);
    }

    /**
     * 퀴즈 상태 새로고침 (응시 후 상태 업데이트용)
     */
    @GetMapping("/{quizId}/status")
    public ResponseEntity<QuizStatusResponse> getQuizStatus(
            @PathVariable Long classroomId,
            @PathVariable Long quizId,
            @RequestParam Long userId) {

        QuizStatusResponse response = quizService.getQuizStatus(classroomId, quizId, userId);
        return ResponseEntity.ok(response);
    }
}