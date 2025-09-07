package com.eddie.lms.domain.progress.service;

import com.eddie.lms.domain.progress.dto.request.LearningProgressUpdateRequest;
import com.eddie.lms.domain.progress.dto.response.LearningProgressResponse;
import com.eddie.lms.domain.progress.entity.LearningProgress;
import com.eddie.lms.domain.progress.repository.LearningProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LearningProgressService {

    private final LearningProgressRepository learningProgressRepository;

    /**
     * 진도율 업데이트
     */
    public LearningProgressResponse updateProgress(Long lessonId, Long userId, LearningProgressUpdateRequest request) {
        log.info("Updating progress: lessonId={}, userId={}, percentage={}",
                lessonId, userId, request.getCompletionPercentage());

        LearningProgress progress = learningProgressRepository
                .findByLessonIdAndUserId(lessonId, userId)
                .orElse(LearningProgress.builder()
                        .lessonId(lessonId)
                        .userId(userId)
                        .completionPercentage(0.0)
                        .lastAccessed(LocalDateTime.now())
                        .build());

        progress.setCompletionPercentage(request.getCompletionPercentage());
        progress.setLastAccessedTime(request.getLastAccessedTime());
        progress.setLastAccessed(LocalDateTime.now());

        // 90% 이상이면 완료 처리
        if (request.getCompletionPercentage() >= 90.0 && progress.getCompletedAt() == null) {
            progress.setCompletedAt(LocalDateTime.now());
            log.info("Lesson {} marked as completed for user {}", lessonId, userId);
        }

        LearningProgress saved = learningProgressRepository.save(progress);
        return convertToResponse(saved);
    }

    /**
     * 진도율 조회
     */
    @Transactional(readOnly = true)
    public LearningProgressResponse getProgress(Long lessonId, Long userId) {
        log.info("Getting progress: lessonId={}, userId={}", lessonId, userId);

        return learningProgressRepository
                .findByLessonIdAndUserId(lessonId, userId)
                .map(this::convertToResponse)
                .orElse(LearningProgressResponse.builder()
                        .completionPercentage(0.0)
                        .lastAccessedTime(0.0)
                        .isCompleted(false)
                        .build());
    }

    /**
     * 수업 완료 처리
     */
    public LearningProgressResponse markAsCompleted(Long lessonId, Long userId) {
        log.info("Marking as completed: lessonId={}, userId={}", lessonId, userId);

        LearningProgress progress = learningProgressRepository
                .findByLessonIdAndUserId(lessonId, userId)
                .orElse(LearningProgress.builder()
                        .lessonId(lessonId)
                        .userId(userId)
                        .completionPercentage(0.0)
                        .lastAccessed(LocalDateTime.now())
                        .build());

        progress.setCompletionPercentage(100.0);
        progress.setCompletedAt(LocalDateTime.now());
        progress.setLastAccessed(LocalDateTime.now());

        LearningProgress saved = learningProgressRepository.save(progress);
        return convertToResponse(saved);
    }

    /**
     * Entity를 Response DTO로 변환
     */
    private LearningProgressResponse convertToResponse(LearningProgress progress) {
        return LearningProgressResponse.builder()
                .completionPercentage(progress.getCompletionPercentage())
                .lastAccessedTime(progress.getLastAccessedTime())
                .isCompleted(progress.getCompletedAt() != null)
                .lastAccessed(progress.getLastAccessed())
                .completedAt(progress.getCompletedAt())
                .build();
    }
}