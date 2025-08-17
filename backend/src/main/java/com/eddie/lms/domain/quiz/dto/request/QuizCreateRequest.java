package com.eddie.lms.domain.quiz.dto.request;

import com.eddie.lms.domain.quiz.entity.QuizQuestion;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizCreateRequest {
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer timeLimitMinutes;
    private List<QuestionCreateRequest> questions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionCreateRequest {
        private String questionText;
        private QuizQuestion.QuestionType questionType;
        private String options;  // JSON 문자열
        private String correctAnswer;
        private Integer points;
        private Integer orderIndex;
    }
}
