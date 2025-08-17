package com.eddie.lms.domain.classroom.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomJoinRequest {
    private String classroomCode;
}
