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
public class LessonCreateRequest {

    @NotBlank(message = "수업 제목은 필수입니다.")
    @Size(max = 255, message = "수업 제목은 255자를 초과할 수 없습니다.")
    private String title;

    @Size(max = 1000, message = "수업 설명은 1000자를 초과할 수 없습니다.")
    private String description;

    @NotNull(message = "수업 유형은 필수입니다.")
    private Lesson.LessonType lessonType;

    private Long curriculumId;

    @NotNull(message = "수업 일정은 필수입니다.")
    @Future(message = "수업 일정은 미래 시간이어야 합니다.")
    private LocalDateTime scheduledAt;

    @NotNull(message = "수업 시간은 필수입니다.")
    @Min(value = 1, message = "수업 시간은 최소 1분이어야 합니다.")
    @Max(value = 480, message = "수업 시간은 최대 8시간(480분)을 초과할 수 없습니다.")
    private Integer durationMinutes;

    private List<LearningMaterialCreateRequest> materials;
}