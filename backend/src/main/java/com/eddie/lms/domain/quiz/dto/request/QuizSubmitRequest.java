package com.eddie.lms.domain.quiz.dto.request;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSubmitRequest {
    private List<AnswerRequest> answers;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnswerRequest {
        private Long questionId;
        private String answer;
    }
}