package com.eddie.lms.domain.user.controller;

import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.dto.response.UserResponse;
import com.eddie.lms.domain.user.service.UserService;
import com.eddie.lms.domain.user.service.UserService.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 관리 컨트롤러 (인증이 필요한 기능들)
 * 회원가입/로그인은 AuthController로 분리함
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 모든 사용자 조회 (인증 필요)
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(Authentication authentication) {
        log.info("GET /api/users - requested by: {}", getCurrentUserEmail(authentication));

        try {
            List<UserResponse> users = userService.getAllUsers();
            log.info("Found {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Failed to get all users", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 사용자 조회 (인증 필요)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(
            @PathVariable Long userId,
            Authentication authentication) {

        log.info("GET /api/users/{} - requested by: {}", userId, getCurrentUserEmail(authentication));

        try {
            UserResponse user = userService.getUser(userId);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to get user: {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 현재 로그인한 사용자 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        log.info("GET /api/users/me - requested by: {}", getCurrentUserEmail(authentication));

        try {
            User currentUser = getAuthenticatedUser(authentication);
            UserResponse userResponse = userService.getCurrentUser(currentUser);
            return ResponseEntity.ok(userResponse);
        } catch (Exception e) {
            log.error("Failed to get current user info", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 현재 로그인한 사용자 정보 수정
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            @RequestBody UserUpdateRequest request,
            Authentication authentication) {

        log.info("PUT /api/users/me - requested by: {}", getCurrentUserEmail(authentication));

        try {
            User currentUser = getAuthenticatedUser(authentication);
            UserResponse updatedUser = userService.updateUser(currentUser, request);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update user: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to update user info", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자 삭제 (관리자 기능 - 추후 ADMIN 역할 추가 시 사용)
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long userId,
            Authentication authentication) {

        log.info("DELETE /api/users/{} - requested by: {}", userId, getCurrentUserEmail(authentication));

        try {
            userService.deleteUser(userId);
            log.info("User deleted successfully: {}", userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete user: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to delete user: {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // === 헬퍼 메서드들 ===

    /**
     * 인증된 사용자 정보 추출
     */
    private User getAuthenticatedUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }

    /**
     * 현재 사용자 이메일 추출
     */
    private String getCurrentUserEmail(Authentication authentication) {
        return getAuthenticatedUser(authentication).getEmail();
    }
}