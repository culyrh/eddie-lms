package com.eddie.lms.domain.auth.service;

import com.eddie.lms.domain.auth.dto.request.LoginRequest;
import com.eddie.lms.domain.auth.dto.response.LoginResponse;
import com.eddie.lms.domain.auth.dto.response.RegisterResponse;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.dto.request.UserCreateRequest;
import com.eddie.lms.domain.user.dto.response.UserResponse;
import com.eddie.lms.domain.user.repository.UserRepository;
import com.eddie.lms.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 회원가입
     */
    @Transactional
    public RegisterResponse register(UserCreateRequest request) {
        log.info("Register attempt: {}", request.getEmail());

        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 사용자 생성
        User newUser = User.builder()
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName().trim())
                .userType(request.getUserType())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(newUser);

        // JWT 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(
                savedUser.getUserId(),
                savedUser.getEmail(),
                savedUser.getUserType().name()
        );

        log.info("User registered successfully: {}", savedUser.getUserId());

        return RegisterResponse.builder()
                .accessToken(accessToken)
                .user(convertToUserResponse(savedUser))
                .message("회원가입 성공")
                .build();
    }

    /**
     * 로그인
     */
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt: {}", request.getEmail());

        // 사용자 조회
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        // 계정 활성화 상태 확인
        if (!user.getIsActive()) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        // 암호화된 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        log.info("Login successful: {}", user.getUserId());

        // JWT 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(
                user.getUserId(),
                user.getEmail(),
                user.getUserType().name()
        );

        return LoginResponse.builder()
                .accessToken(accessToken)
                .user(convertToUserResponse(user))
                .message("로그인 성공")
                .build();
    }

    /**
     * 이메일 중복 확인
     */
    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email.trim());
    }

    /**
     * User 엔티티를 UserResponse DTO로 변환
     */
    private UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .userType(user.getUserType())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}