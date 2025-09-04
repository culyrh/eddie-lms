package com.eddie.lms.domain.lesson.dto.request;

import com.eddie.lms.domain.lesson.entity.Lesson;
import jakarta.validation.constraints.Size;
import lombok.*;

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

    private Boolean isCompleted;
}