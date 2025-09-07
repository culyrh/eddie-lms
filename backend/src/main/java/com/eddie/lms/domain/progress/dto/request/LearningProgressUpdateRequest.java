package com.eddie.lms.domain.progress.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearningProgressUpdateRequest {

    private Long userId;

    @NotNull(message = "완료 비율은 필수입니다.")
    @DecimalMin(value = "0.0", message = "완료 비율은 0% 이상이어야 합니다.")
    @DecimalMax(value = "100.0", message = "완료 비율은 100% 이하여야 합니다.")
    private Double completionPercentage;

    @DecimalMin(value = "0.0", message = "마지막 접근 시간은 0 이상이어야 합니다.")
    private Double lastAccessedTime;

    @DecimalMin(value = "0.0", message = "시청 시간은 0 이상이어야 합니다.")
    private Double watchedDuration;
}