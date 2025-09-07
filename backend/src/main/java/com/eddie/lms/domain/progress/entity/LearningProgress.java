package com.eddie.lms.domain.progress.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "learning_progress",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "lesson_id"})
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "completion_percentage", nullable = false)
    @Builder.Default
    private Double completionPercentage = 0.0;

    @Column(name = "last_accessed_time")
    private Double lastAccessedTime;

    @Column(name = "last_accessed", nullable = false)
    @Builder.Default
    private LocalDateTime lastAccessed = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 수업이 완료되었는지 확인
     */
    public boolean isCompleted() {
        return completedAt != null;
    }

    /**
     * 진도율을 퍼센트로 반환
     */
    public int getCompletionPercentageAsInt() {
        return (int) Math.round(completionPercentage);
    }
}