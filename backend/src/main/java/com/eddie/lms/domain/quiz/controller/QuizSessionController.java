package com.eddie.lms.domain.quiz.controller;

import com.eddie.lms.domain.quiz.entity.QuizSession;
import com.eddie.lms.domain.quiz.service.QuizSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 퀴즈 세션 관리 컨트롤러 - 이탈 방지 기능
 */
@Slf4j
@RestController
@RequestMapping("/api/quiz-sessions")
@RequiredArgsConstructor
public class QuizSessionController {

    private final QuizSessionService quizSessionService;

    /**
     * 퀴즈 세션 시작
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startSession(
            @RequestParam Long quizId,
            @RequestParam Long studentId) {

        try {
            QuizSession session = quizSessionService.startSession(quizId, studentId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "sessionToken", session.getSessionToken(),
                    "message", "퀴즈 세션이 시작되었습니다."
            ));

        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 세션 진행 상태 변경
     */
    @PostMapping("/{sessionToken}/progress")
    public ResponseEntity<Map<String, Object>> markInProgress(@PathVariable String sessionToken) {
        try {
            quizSessionService.markInProgress(sessionToken);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "세션이 진행 상태로 변경되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 세션 완료
     */
    @PostMapping("/{sessionToken}/complete")
    public ResponseEntity<Map<String, Object>> completeSession(@PathVariable String sessionToken) {
        try {
            quizSessionService.completeSession(sessionToken);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "퀴즈 세션이 완료되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 세션 강제 종료
     */
    @PostMapping("/{sessionToken}/terminate")
    public ResponseEntity<Map<String, Object>> terminateSession(
            @PathVariable String sessionToken,
            @RequestBody Map<String, String> request) {

        String reason = request.getOrDefault("reason", "사용자 요청");

        try {
            quizSessionService.terminateSession(sessionToken, reason);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "퀴즈 세션이 종료되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 세션 상태 확인
     */
    @GetMapping("/{sessionToken}/status")
    public ResponseEntity<Map<String, Object>> getSessionStatus(@PathVariable String sessionToken) {
        try {
            boolean valid = quizSessionService.isSessionValid(sessionToken);

            if (valid) {
                QuizSession session = quizSessionService.getSessionInfo(sessionToken);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "valid", true,
                        "status", session.getSessionStatus().name(),
                        "tabSwitchCount", session.getTabSwitchCount(),
                        "violationCount", session.getViolationCount(),
                        "warningCount", session.getWarningCount()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "valid", false,
                        "message", "세션이 유효하지 않습니다."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 재응시 가능 여부 확인
     */
    @GetMapping("/can-retake")
    public ResponseEntity<Map<String, Object>> canRetake(
            @RequestParam Long quizId,
            @RequestParam Long studentId) {

        boolean canRetake = quizSessionService.canRetake(quizId, studentId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "canRetake", canRetake,
                "message", canRetake ? "응시 가능합니다." : "이미 응시한 퀴즈입니다."
        ));
    }
}