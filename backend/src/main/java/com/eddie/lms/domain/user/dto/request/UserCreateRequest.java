package com.eddie.lms.domain.user.dto.request;

import com.eddie.lms.domain.user.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreateRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    @Size(max = 100, message = "이메일은 100자를 초과할 수 없습니다")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 6, max = 20, message = "비밀번호는 6자 이상 20자 이하여야 합니다")
    @Pattern(
            regexp = "^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]*$",
            message = "비밀번호는 영문과 숫자를 포함해야 합니다"
    )
    private String password;

    @NotBlank(message = "이름은 필수입니다")
    @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다")
    private String name;

    @NotNull(message = "사용자 타입을 선택해주세요")
    private User.UserType userType;
}