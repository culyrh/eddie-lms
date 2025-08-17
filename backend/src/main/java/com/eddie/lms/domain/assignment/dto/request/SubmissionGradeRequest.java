package com.eddie.lms.domain.assignment.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionGradeRequest {
    private Integer score;
    private String feedback;
}