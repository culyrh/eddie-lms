package com.eddie.lms.domain.auth.controller;

import com.eddie.lms.domain.auth.dto.request.LoginRequest;
import com.eddie.lms.domain.auth.dto.response.LoginResponse;
import com.eddie.lms.domain.auth.dto.response.RegisterResponse;
import com.eddie.lms.domain.auth.service.AuthService;
import com.eddie.lms.domain.user.dto.request.UserCreateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 인증 관련 컨트롤러 (회원가입, 로그인)
 * 인증이 필요한 사용자 관리 기능은 UserController로 분리함
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserCreateRequest request) {
        log.info("POST /api/auth/register - email: {}", request.getEmail());

        try {
            RegisterResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Registration failed: {}", e.getMessage());
            return createErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
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
        log.info("POST /api/auth/login - email: {}", request.getEmail());

        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Login failed for {}: {}", request.getEmail(), e.getMessage());
            return createErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            log.error("Login error for {}: {}", request.getEmail(), e.getMessage(), e);
            return createErrorResponse("로그인 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 이메일 중복 확인
     */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        log.info("GET /api/auth/check-email - email: {}", email);

        try {
            boolean exists = authService.isEmailExists(email);

            return ResponseEntity.ok(Map.of(
                    "exists", exists,
                    "message", exists ? "이미 사용 중인 이메일입니다." : "사용 가능한 이메일입니다."
            ));
        } catch (Exception e) {
            log.error("Email check error for {}: {}", email, e.getMessage(), e);
            return createErrorResponse("이메일 확인 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 로그아웃 (토큰 무효화)
     * 클라이언트에서 토큰을 삭제하면 되므로 별도 처리 없음
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        log.info("POST /api/auth/logout");

        return ResponseEntity.ok(Map.of(
                "message", "로그아웃 되었습니다."
        ));
    }

    /**
     * 에러 응답 생성 헬퍼 메서드
     */
    private ResponseEntity<Map<String, Object>> createErrorResponse(String message, HttpStatus status) {
        return ResponseEntity.status(status).body(Map.of(
                "success", false,
                "message", message,
                "timestamp", System.currentTimeMillis()
        ));
    }
}