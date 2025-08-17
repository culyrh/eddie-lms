package com.eddie.lms.domain.quiz.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResultSummaryResponse {
    private Long quizId;
    private String quizTitle;
    private Integer totalQuestions;
    private Integer maxPossibleScore;
    private Integer totalParticipants;
    private Double averageScore;
    private Double averagePercentage;
    private List<ParticipantResult> participants;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParticipantResult {
        private Long userId;
        private String studentName;
        private Integer score;
        private Integer correctAnswers;
        private Integer totalQuestions;
        private Double percentage;
        private LocalDateTime submittedAt;
        private String timeSpent; // 추후 구현
    }
}
