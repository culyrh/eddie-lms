package com.eddie.lms.domain.lesson.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 커리큘럼 엔티티 (진도 추적 기능 제거됨)
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

    // 수업들과의 연관관계 (OneToMany)
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
     * 가장 최근에 생성된 수업 조회
     */
    public Lesson getLatestLesson() {
        if (lessons == null || lessons.isEmpty()) {
            return null;
        }

        return lessons.stream()
                .max((l1, l2) -> l1.getCreatedAt().compareTo(l2.getCreatedAt()))
                .orElse(null);
    }

    /**
     * 가장 먼저 생성된 수업 조회
     */
    public Lesson getFirstLesson() {
        if (lessons == null || lessons.isEmpty()) {
            return null;
        }

        return lessons.stream()
                .min((l1, l2) -> l1.getCreatedAt().compareTo(l2.getCreatedAt()))
                .orElse(null);
    }

    /**
     * 커리큘럼이 비어있는지 확인
     */
    public boolean isEmpty() {
        return lessons == null || lessons.isEmpty();
    }

    /**
     * 특정 수업이 이 커리큘럼에 속하는지 확인
     */
    public boolean containsLesson(Long lessonId) {
        if (lessons == null || lessonId == null) {
            return false;
        }

        return lessons.stream()
                .anyMatch(lesson -> lesson.getLessonId().equals(lessonId));
    }

    /**
     * 커리큘럼의 총 학습자료 개수 계산
     */
    public int getTotalMaterialCount() {
        if (lessons == null) {
            return 0;
        }

        return lessons.stream()
                .mapToInt(Lesson::getMaterialCount)
                .sum();
    }
}