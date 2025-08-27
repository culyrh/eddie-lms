package com.eddie.lms.domain.lesson.dto.response;

import com.eddie.lms.domain.lesson.entity.Lesson;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResponse {

    private Long lessonId;
    private Long curriculumId;
    private String curriculumTitle;
    private String title;
    private String description;
    private Lesson.LessonType lessonType;
    private String lessonTypeName;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private Boolean isCompleted;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 학습 자료 목록
    private List<LearningMaterialResponse> materials;

    // 학습 진도 정보 (교육자용)
    private LessonProgressInfo progressInfo;

    // 개인 학습 진도 (학습자용)
    private PersonalProgressInfo personalProgress;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LessonProgressInfo {
        private Long totalStudents;
        private Long completedStudents;
        private Long startedStudents;
        private Double averageProgress;
        private Long completionRate; // 완료율 (%)
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PersonalProgressInfo {
        private Double completionPercentage;
        private LocalDateTime lastAccessed;
        private LocalDateTime completedAt;
        private String progressStatus;
        private Boolean isAccessible;
    }
}