package com.eddie.lms.domain.quiz.dto.request;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizUpdateRequest {
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer timeLimitMinutes;
    private List<QuizCreateRequest.QuestionCreateRequest> questions;
}