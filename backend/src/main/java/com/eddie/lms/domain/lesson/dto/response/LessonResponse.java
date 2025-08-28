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
    private Boolean isCompleted;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<LearningMaterialResponse> materials;
    private PersonalProgressInfo personalProgress;  // 학습자용
    private LessonProgressInfo progressInfo;        // 교육자용

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalProgressInfo {
        private Double completionPercentage;
        private LocalDateTime lastAccessed;
        private LocalDateTime completedAt;
        private String progressStatus;
        private Boolean isAccessible;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonProgressInfo {
        private Long totalStudents;
        private Long completedStudents;
        private Long startedStudents;
        private Double averageProgress;
        private Long completionRate;
    }
}