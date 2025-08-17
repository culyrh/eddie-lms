package com.eddie.lms.domain.quiz.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 퀴즈 응답 엔티티 (학생들의 답안)
 */
@Entity
@Table(name = "quiz_response",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"quiz_id", "student_id", "question_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswerRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Long responseId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "answer", nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @CreationTimestamp
    @Column(name = "answered_at", nullable = false, updatable = false)
    private LocalDateTime answeredAt;
}