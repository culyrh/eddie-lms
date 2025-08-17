package com.eddie.lms.domain.quiz.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResponse {
    private Long quizId;
    private Long classroomId;
    private Long creatorId;
    private String creatorName;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer timeLimitMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer totalQuestions;
    private Integer totalPoints;
    private Integer participantCount;
    private String status; // "NOT_STARTED", "ACTIVE", "ENDED"
    private Boolean hasSubmitted;
}