package com.eddie.lms.domain.auth.dto.response;

import com.eddie.lms.domain.user.dto.response.UserResponse;
import lombok.*;

/**
 * 로그인 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String accessToken;
    private UserResponse user;
    private String message;
}