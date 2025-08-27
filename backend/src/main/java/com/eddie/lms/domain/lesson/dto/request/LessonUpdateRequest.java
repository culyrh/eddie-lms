package com.eddie.lms.domain.lesson.dto.request;

import com.eddie.lms.domain.lesson.entity.Lesson;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonUpdateRequest {

    @Size(max = 255, message = "수업 제목은 255자를 초과할 수 없습니다.")
    private String title;

    @Size(max = 1000, message = "수업 설명은 1000자를 초과할 수 없습니다.")
    private String description;

    private Lesson.LessonType lessonType;

    private Long curriculumId;

    private LocalDateTime scheduledAt;

    @Min(value = 1, message = "수업 시간은 최소 1분이어야 합니다.")
    @Max(value = 480, message = "수업 시간은 최대 8시간(480분)을 초과할 수 없습니다.")
    private Integer durationMinutes;

    private Boolean isCompleted;

    private List<LearningMaterialCreateRequest> materials;
}