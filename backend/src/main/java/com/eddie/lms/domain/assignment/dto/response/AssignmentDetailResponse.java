package com.eddie.lms.domain.assignment.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentDetailResponse {
    private Long assignmentId;
    private Long classroomId;
    private Long creatorId;
    private String creatorName;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer submissionCount;
    private Boolean isOverdue;
    private List<SubmissionResponse> submissions;  // 교육자만 볼 수 있음
}