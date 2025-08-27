package com.eddie.lms.domain.lesson.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningProgressResponse {

    private Long progressId;
    private Long userId;
    private String userName;
    private Long lessonId;
    private String lessonTitle;
    private BigDecimal completionPercentage;
    private LocalDateTime lastAccessed;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 계산된 필드들
    private String progressStatus;
    private Boolean isCompleted;
    private Boolean isStarted;
    private Long daysSinceLastAccess;
    private Long learningDurationHours;
    private Boolean isRecentlyAccessed;
}