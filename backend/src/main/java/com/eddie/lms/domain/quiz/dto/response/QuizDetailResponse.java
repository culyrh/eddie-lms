package com.eddie.lms.domain.quiz.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDetailResponse {
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
    private String status;
    private List<QuestionResponse> questions;  // 교육자만 볼 수 있음
    private Boolean hasSubmitted;  // 학습자가 이미 제출했는지
}