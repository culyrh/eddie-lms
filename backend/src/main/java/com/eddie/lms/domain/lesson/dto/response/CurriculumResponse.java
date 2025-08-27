package com.eddie.lms.domain.lesson.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumResponse {

    private Long curriculumId;
    private String title;
    private String description;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 커리큘럼 통계
    private Integer lessonCount;
    private Long completedLessonCount;
    private Double progressPercentage;
    private Integer totalDurationMinutes;

    // 포함된 수업 목록
    private List<LessonResponse> lessons;

    // 다음 수업
    private LessonResponse nextLesson;
}