package com.eddie.lms.domain.auth.controller;

import com.eddie.lms.domain.auth.dto.request.LoginRequest;
import com.eddie.lms.domain.auth.dto.response.LoginResponse;
import com.eddie.lms.domain.auth.dto.response.RegisterResponse;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.dto.request.UserCreateRequest;
import com.eddie.lms.domain.user.dto.response.UserResponse;
import com.eddie.lms.domain.user.repository.UserRepository;
import com.eddie.lms.security.jwt.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 인증 관련 컨트롤러 (회원가입, 로그인)
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    /**
     * 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserCreateRequest request) {
        log.info("User registration attempt: {}", request.getEmail());

        try {
            // 이메일 중복 체크
            if (userRepository.existsByEmail(request.getEmail())) {
                log.warn("Registration failed - email already exists: {}", request.getEmail());
                return createErrorResponse("이미 등록된 이메일입니다.", HttpStatus.CONFLICT);
            }

            // 비밀번호 암호화
            String encodedPassword = passwordEncoder.encode(request.getPassword());

            // 사용자 생성
            User newUser = User.builder()
                    .email(request.getEmail().trim())
                    .password(encodedPassword)  // 암호화된 비밀번호 저장
                    .name(request.getName().trim())
                    .userType(request.getUserType())
                    .isActive(true)
                    .build();

            User savedUser = userRepository.save(newUser);

            // JWT 토큰 생성 (회원가입 즉시 로그인)
            String accessToken = jwtTokenProvider.createAccessToken(
                    savedUser.getUserId(),
                    savedUser.getEmail(),
                    savedUser.getUserType().name()
            );

            // 응답 생성
            RegisterResponse response = RegisterResponse.builder()
                    .accessToken(accessToken)
                    .user(convertToResponse(savedUser))
                    .message("회원가입이 완료되었습니다.")
                    .build();

            log.info("User registered successfully: {}", savedUser.getUserId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Registration error for {}: {}", request.getEmail(), e.getMessage(), e);
            return createErrorResponse("회원가입 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt: {}", request.getEmail());

        try {
            // 사용자 조회
            User user = userRepository.findByEmail(request.getEmail().trim())
                    .orElse(null);

            if (user == null) {
                log.warn("Login failed - user not found: {}", request.getEmail());
                return createErrorResponse("이메일 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
            }

            // 계정 활성화 상태 확인
            if (!user.getIsActive()) {
                log.warn("Login failed - inactive account: {}", request.getEmail());
                return createErrorResponse("비활성화된 계정입니다.", HttpStatus.UNAUTHORIZED);
            }

            // 암호화된 비밀번호 검증
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                log.warn("Login failed - invalid password for: {}", request.getEmail());
                return createErrorResponse("이메일 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
            }

            log.info("Login successful: {}", user.getUserId());

            // JWT 토큰 생성
            String accessToken = jwtTokenProvider.createAccessToken(
                    user.getUserId(),
                    user.getEmail(),
                    user.getUserType().name()
            );

            // 토큰과 사용자 정보 모두 반환
            LoginResponse response = LoginResponse.builder()
                    .accessToken(accessToken)
                    .user(convertToResponse(user))
                    .message("로그인 성공")
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Login error for {}: {}", request.getEmail(), e.getMessage(), e);
            return createErrorResponse("로그인 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 이메일 중복 체크 (회원가입 전 확인용)
     */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailDuplicate(@RequestParam String email) {
        log.info("Email duplicate check: {}", email);

        if (email == null || email.trim().isEmpty()) {
            return createErrorResponse("이메일을 입력해주세요.", HttpStatus.BAD_REQUEST);
        }

        boolean exists = userRepository.existsByEmail(email.trim());

        Map<String, Object> response = new HashMap<>();
        response.put("exists", exists);
        response.put("message", exists ? "이미 사용 중인 이메일입니다." : "사용 가능한 이메일입니다.");

        return ResponseEntity.ok(response);
    }

    // === 헬퍼 메서드 ===

    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .userType(user.getUserType())
                .isActive(user.getIsActive())
                .build();
    }

    private ResponseEntity<?> createErrorResponse(String message, HttpStatus status) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(status).body(errorResponse);
    }
}