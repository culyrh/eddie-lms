package com.eddie.lms.domain.assignment.dto.request;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentCreateRequest {
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxScore;
}