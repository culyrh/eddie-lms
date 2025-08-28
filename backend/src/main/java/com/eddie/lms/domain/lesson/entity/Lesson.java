package com.eddie.lms.domain.lesson.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 수업 엔티티
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

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

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

    // 학습 진도와의 연관관계 (OneToMany)
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LearningProgress> progressList = new ArrayList<>();

    /**
     * 수업 유형 열거형 (실시간 세션 제거)
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
     * 학습 진도 추가
     */
    public void addProgress(LearningProgress progress) {
        progressList.add(progress);
        progress.setLesson(this);
    }

    /**
     * 수업 완료 상태 토글
     */
    public void toggleCompletion() {
        this.isCompleted = !this.isCompleted;
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
     * 수업이 시작 가능한지 확인 (업로드된 자료는 언제든 접근 가능)
     */
    public boolean canStart() {
        return true;
    }

    /**
     * 수업 상태 확인 (실시간 세션 관련 제거)
     */
    public String getStatus() {
        if (isCompleted) {
            return "완료됨";
        }
        return "수강 가능";
    }
}