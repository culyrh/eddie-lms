package com.eddie.lms.domain.quiz.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizStatusResponse {
    private Long quizId;
    private String status; // NOT_STARTED, ACTIVE, ENDED
    private Boolean hasSubmitted;
    private Boolean canTake;
}