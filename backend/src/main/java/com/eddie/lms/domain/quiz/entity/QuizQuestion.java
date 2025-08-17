package com.eddie.lms.domain.quiz.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 퀴즈 문제 엔티티
 */
@Entity
@Table(name = "quiz_question")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @Column(name = "options")
    private String options;   // 수정

    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "points", nullable = false)
    private Integer points;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    /**
     * 문제 타입 열거형
     */
    public enum QuestionType {
        MULTIPLE_CHOICE,  // 객관식
        SHORT_ANSWER      // 서술형
    }
}