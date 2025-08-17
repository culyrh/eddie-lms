package com.eddie.lms.domain.assignment.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentResponse {
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
    private Integer submissionCount;  // 제출한 학생 수
    private Boolean isOverdue;  // 제출 기한 지났는지 여부
}