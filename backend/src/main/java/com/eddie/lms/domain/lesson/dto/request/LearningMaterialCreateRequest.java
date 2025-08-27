package com.eddie.lms.domain.lesson.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningMaterialCreateRequest {

    @NotBlank(message = "자료 제목은 필수입니다.")
    @Size(max = 255, message = "자료 제목은 255자를 초과할 수 없습니다.")
    private String title;

    @NotBlank(message = "파일명은 필수입니다.")
    private String fileName;

    private String filePath; // S3 연동 후 사용

    @NotBlank(message = "파일 유형은 필수입니다.")
    private String fileType;

    @Min(value = 0, message = "파일 크기는 0보다 커야 합니다.")
    private Long fileSize;
}