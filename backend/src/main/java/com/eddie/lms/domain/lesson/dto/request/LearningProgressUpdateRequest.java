package com.eddie.lms.domain.lesson.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningProgressUpdateRequest {

    @NotNull(message = "완료율은 필수입니다.")
    @DecimalMin(value = "0.0", message = "완료율은 0% 이상이어야 합니다.")
    @DecimalMax(value = "100.0", message = "완료율은 100% 이하여야 합니다.")
    private BigDecimal completionPercentage;
}