// ClassroomCreateRequest.java
package com.eddie.lms.domain.classroom.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomCreateRequest {
    private String classroomName;
    private String description;
}
