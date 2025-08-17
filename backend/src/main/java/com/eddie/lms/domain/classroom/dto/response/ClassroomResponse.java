package com.eddie.lms.domain.classroom.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomResponse {
    private Long classroomId;
    private Long educatorId;
    private String educatorName;  // User 정보에서 가져올 예정
    private String classroomName;
    private String description;
    private String classroomCode;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer memberCount;  // 참여한 학습자 수
}
