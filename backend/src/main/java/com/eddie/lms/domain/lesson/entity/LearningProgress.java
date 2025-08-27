package com.eddie.lms.domain.lesson.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 학습 진도 엔티티
 */
@Entity
@Table(name = "learning_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "lesson_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "completion_percentage", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal completionPercentage = BigDecimal.ZERO;

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
     * 학습 진도 업데이트
     */
    public void updateProgress(BigDecimal percentage) {
        if (percentage != null) {
            // 0-100% 범위로 제한
            if (percentage.compareTo(BigDecimal.ZERO) < 0) {
                percentage = BigDecimal.ZERO;
            } else if (percentage.compareTo(BigDecimal.valueOf(100)) > 0) {
                percentage = BigDecimal.valueOf(100);
            }

            this.completionPercentage = percentage;
            this.lastAccessed = LocalDateTime.now();

            // 100% 완료 시 완료 시간 기록
            if (percentage.compareTo(BigDecimal.valueOf(100)) == 0 && completedAt == null) {
                this.completedAt = LocalDateTime.now();
            }
        }
    }

    /**
     * 학습 완료 여부 확인
     */
    public boolean isCompleted() {
        return completionPercentage.compareTo(BigDecimal.valueOf(100)) == 0;
    }

    /**
     * 학습 시작 여부 확인
     */
    public boolean isStarted() {
        return completionPercentage.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * 진도율을 Double로 반환
     */
    public double getProgressAsDouble() {
        return completionPercentage.doubleValue();
    }

    /**
     * 진도율을 정수로 반환 (0-100)
     */
    public int getProgressAsInteger() {
        return completionPercentage.intValue();
    }

    /**
     * 학습 상태 문자열 반환
     */
    public String getProgressStatus() {
        if (isCompleted()) {
            return "완료";
        } else if (isStarted()) {
            return "진행 중";
        } else {
            return "미시작";
        }
    }

    /**
     * 마지막 접근 이후 경과 시간 (일 단위)
     */
    public long getDaysSinceLastAccess() {
        return java.time.Duration.between(lastAccessed, LocalDateTime.now()).toDays();
    }

    /**
     * 학습 소요 시간 계산 (생성일부터 완료일까지)
     */
    public long getLearningDurationHours() {
        if (completedAt == null) {
            return java.time.Duration.between(createdAt, LocalDateTime.now()).toHours();
        }
        return java.time.Duration.between(createdAt, completedAt).toHours();
    }

    /**
     * 진도율이 특정 값 이상인지 확인
     */
    public boolean isProgressAtLeast(double percentage) {
        return completionPercentage.compareTo(BigDecimal.valueOf(percentage)) >= 0;
    }

    /**
     * 최근 접근인지 확인 (1주일 이내)
     */
    public boolean isRecentlyAccessed() {
        return getDaysSinceLastAccess() <= 7;
    }

    /**
     * 학습 진도를 증가시킴
     */
    public void incrementProgress(double increment) {
        BigDecimal newProgress = completionPercentage.add(BigDecimal.valueOf(increment));
        updateProgress(newProgress);
    }

    /**
     * 학습을 완료 상태로 설정
     */
    public void markAsCompleted() {
        updateProgress(BigDecimal.valueOf(100));
    }

    /**
     * 학습을 초기화
     */
    public void resetProgress() {
        this.completionPercentage = BigDecimal.ZERO;
        this.completedAt = null;
        this.lastAccessed = LocalDateTime.now();
    }
}