package com.eddie.lms.domain.lesson.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 커리큘럼 엔티티
 */
@Entity
@Table(name = "curriculums")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Curriculum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "curriculum_id")
    private Long curriculumId;

    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 수업들과의 연관관계 (OneToMany) - createdAt 순으로 변경
    @OneToMany(mappedBy = "curriculumId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<Lesson> lessons = new ArrayList<>();

    /**
     * 커리큘럼 정보 업데이트
     */
    public void updateInfo(String title, String description, Integer orderIndex) {
        if (title != null && !title.trim().isEmpty()) {
            this.title = title.trim();
        }
        if (description != null) {
            this.description = description.trim();
        }
        if (orderIndex != null && orderIndex >= 0) {
            this.orderIndex = orderIndex;
        }
    }

    /**
     * 수업 개수 조회
     */
    public int getLessonCount() {
        return lessons != null ? lessons.size() : 0;
    }

    /**
     * 완료된 수업 개수 조회
     */
    public long getCompletedLessonCount() {
        if (lessons == null) {
            return 0;
        }
        return lessons.stream()
                .filter(Lesson::getIsCompleted)
                .count();
    }

    /**
     * 진행률 계산 (0-100%)
     */
    public double getProgressPercentage() {
        int totalLessons = getLessonCount();
        if (totalLessons == 0) {
            return 0.0;
        }
        return (getCompletedLessonCount() * 100.0) / totalLessons;
    }

    /**
     * 다음 수업 조회 (실시간 세션 필드 제거)
     */
    public Lesson getNextLesson() {
        if (lessons == null) {
            return null;
        }

        // 미완료 수업 중 가장 먼저 생성된 것 반환
        return lessons.stream()
                .filter(lesson -> !lesson.getIsCompleted())
                .min((l1, l2) -> l1.getCreatedAt().compareTo(l2.getCreatedAt()))
                .orElse(null);
    }

    /**
     * 커리큘럼의 총 소요 시간 계산 (분) - 실시간 세션 관련 제거
     */
    public int getTotalDurationMinutes() {
        // durationMinutes 필드가 없으므로 0 반환 또는 다른 로직으로 대체
        return 0;
    }
}