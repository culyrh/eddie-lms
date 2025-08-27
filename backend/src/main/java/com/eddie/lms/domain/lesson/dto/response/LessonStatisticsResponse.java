package com.eddie.lms.domain.lesson.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonStatisticsResponse {

    // 기본 통계
    private Long totalLessons;
    private Long completedLessons;
    private Long videoLessons;
    private Long documentLessons;
    private Double averageDuration;
    private Long totalMaterials;
    private Long totalFileSize;

    // 진도 통계
    private Long totalStudents;
    private Long activeStudents;
    private Double overallProgress;
    private Long completedStudentsCount;
    private Long inProgressStudentsCount;
    private Long notStartedStudentsCount;

    // 인기 수업
    private List<PopularLessonInfo> popularLessons;

    // 저조한 수업
    private List<PopularLessonInfo> lowProgressLessons;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PopularLessonInfo {
        private Long lessonId;
        private String title;
        private Double averageProgress;
    }
}