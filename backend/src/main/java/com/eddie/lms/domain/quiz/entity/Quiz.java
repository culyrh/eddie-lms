package com.eddie.lms.domain.quiz.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 퀴즈 엔티티
 */
@Entity
@Table(name = "quiz")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quiz_id")
    private Long quizId;

    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;  // 퀴즈를 만든 교육자 ID

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "time_limit_minutes", nullable = false)
    private Integer timeLimitMinutes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 퀴즈가 현재 진행 중인지 확인
     */
    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(startTime) && now.isBefore(endTime);
    }

    /**
     * 퀴즈가 시작 전인지 확인
     */
    public boolean isNotStarted() {
        return LocalDateTime.now().isBefore(startTime);
    }

    /**
     * 퀴즈가 종료되었는지 확인
     */
    public boolean isEnded() {
        return LocalDateTime.now().isAfter(endTime);
    }
}