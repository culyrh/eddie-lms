// API 요청/응답 데이터 전송 객체 (DTO)
// 클라이언트와 서버 간 데이터 교환 형식 정의
// 엔티티와 분리하여 보안성 향상

package com.eddie.lms.domain.user.dto.response;

import com.eddie.lms.domain.user.entity.User;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long userId;
    private String email;
    private String name;
    private User.UserType userType;
    private Boolean isActive;
}