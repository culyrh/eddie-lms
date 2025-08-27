package com.eddie.lms.domain.lesson.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumUpdateRequest {

    @Size(max = 255, message = "커리큘럼 제목은 255자를 초과할 수 없습니다.")
    private String title;

    @Size(max = 1000, message = "커리큘럼 설명은 1000자를 초과할 수 없습니다.")
    private String description;

    @Min(value = 0, message = "순서는 0 이상이어야 합니다.")
    private Integer orderIndex;
}