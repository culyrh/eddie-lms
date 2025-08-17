package com.eddie.lms.domain.quiz.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResultResponse {
    private Long quizId;
    private Long studentId;
    private String studentName;
    private String quizTitle;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer totalPoints;
    private Integer earnedPoints;
    private Double percentage;
    private LocalDateTime submittedAt;
    private List<AnswerResultResponse> answerResults;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnswerResultResponse {
        private Long questionId;
        private String questionText;
        private String studentAnswer;
        private String correctAnswer;
        private Boolean isCorrect;
        private Integer points;
        private LocalDateTime answeredAt;
    }
}