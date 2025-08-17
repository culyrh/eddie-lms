package com.eddie.lms.domain.assignment.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionResponse {
    private Long submissionId;
    private Long assignmentId;
    private Long studentId;
    private String studentName;
    private String submissionText;
    private String fileUrl;
    private Integer score;
    private String feedback;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private Boolean isLate;  // 지연 제출 여부
    private Boolean isGraded;  // 채점 완료 여부
}