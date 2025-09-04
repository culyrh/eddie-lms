package com.eddie.lms.domain.lesson.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 수업 엔티티 (진도 추적 기능 제거됨)
 */
@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lesson_id")
    private Long lessonId;

    @Column(name = "curriculum_id")
    private Long curriculumId;

    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "lesson_type", nullable = false, length = 20)
    private LessonType lessonType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 학습 자료와의 연관관계 (OneToMany)
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LearningMaterial> materials = new ArrayList<>();

    // 커리큘럼과의 연관관계 (ManyToOne) - 필요시 추가
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id", insertable = false, updatable = false)
    private Curriculum curriculum;

    /**
     * 수업 유형 열거형
     */
    public enum LessonType {
        VIDEO("영상 수업"),
        DOCUMENT("자료 수업");

        private final String displayName;

        LessonType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * 학습 자료 추가
     */
    public void addMaterial(LearningMaterial material) {
        materials.add(material);
        material.setLesson(this);
    }

    /**
     * 학습 자료 제거
     */
    public void removeMaterial(LearningMaterial material) {
        materials.remove(material);
        material.setLesson(null);
    }

    /**
     * 수업 정보 업데이트
     */
    public void updateInfo(String title, String description, LessonType lessonType) {
        if (title != null && !title.trim().isEmpty()) {
            this.title = title.trim();
        }
        if (description != null) {
            this.description = description.trim();
        }
        if (lessonType != null) {
            this.lessonType = lessonType;
        }
    }

    /**
     * 특정 커리큘럼에 속하는지 확인
     */
    public boolean belongsToCurriculum(Long curriculumId) {
        return this.curriculumId != null && this.curriculumId.equals(curriculumId);
    }

    /**
     * 수업 상태 확인 (단순화됨)
     */
    public String getStatus() {
        return "수강 가능";
    }

    /**
     * 수업 자료 개수 조회
     */
    public int getMaterialCount() {
        return materials.size();
    }

    /**
     * 수업이 비어있는지 확인
     */
    public boolean isEmpty() {
        return materials.isEmpty();
    }
}