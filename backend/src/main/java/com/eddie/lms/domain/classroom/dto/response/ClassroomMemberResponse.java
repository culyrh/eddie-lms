package com.eddie.lms.domain.classroom.dto.response;

import com.eddie.lms.domain.classroom.entity.ClassroomMember;
import com.eddie.lms.domain.user.entity.User;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomMemberResponse {
    private Long memberId;
    private Long userId;
    private String userName;
    private String userEmail;
    private User.UserType userType;
    private ClassroomMember.MemberStatus status;
    private LocalDateTime joinedAt;
}
