package com.eddie.lms.domain.quiz.dto.response;

import com.eddie.lms.domain.quiz.entity.QuizQuestion;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private Long questionId;
    private Long quizId;
    private String questionText;
    private QuizQuestion.QuestionType questionType;
    private String options;  // JSON 문자열
    private String correctAnswer;  // 교육자만 볼 수 있음
    private Integer points;
    private Integer orderIndex;
}