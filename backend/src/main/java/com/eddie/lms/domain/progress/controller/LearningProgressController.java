package com.eddie.lms.domain.progress.controller;

import com.eddie.lms.domain.progress.dto.request.LearningProgressUpdateRequest;
import com.eddie.lms.domain.progress.dto.response.LearningProgressResponse;
import com.eddie.lms.domain.progress.service.LearningProgressService;
import com.eddie.lms.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
@Slf4j
public class LearningProgressController {

    private final LearningProgressService learningProgressService;

    /**
     * 진도율 업데이트
     */
    @PutMapping("/{lessonId}/progress")
    public ResponseEntity<LearningProgressResponse> updateProgress(
            @PathVariable Long lessonId,
            @RequestBody LearningProgressUpdateRequest request,
            Authentication authentication) {

        try {
            User user = (User) authentication.getPrincipal();
            log.info("Updating progress for lesson {} by user {}", lessonId, user.getUserId());

            LearningProgressResponse response = learningProgressService.updateProgress(
                    lessonId, user.getUserId(), request
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to update progress for lesson {}", lessonId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 진도율 조회
     */
    @GetMapping("/{lessonId}/progress/{userId}")
    public ResponseEntity<LearningProgressResponse> getProgress(
            @PathVariable Long lessonId,
            @PathVariable Long userId) {

        try {
            log.info("Getting progress for lesson {} and user {}", lessonId, userId);

            LearningProgressResponse response = learningProgressService.getProgress(lessonId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get progress for lesson {} and user {}", lessonId, userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 수업 완료 처리
     */
    @PostMapping("/{lessonId}/complete")
    public ResponseEntity<LearningProgressResponse> markAsCompleted(
            @PathVariable Long lessonId,
            @RequestBody Map<String, Long> request) {

        try {
            Long userId = request.get("userId");
            log.info("Marking lesson {} as completed for user {}", lessonId, userId);

            LearningProgressResponse response = learningProgressService.markAsCompleted(lessonId, userId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to mark lesson {} as completed", lessonId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}