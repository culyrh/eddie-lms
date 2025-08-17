package com.eddie.lms.domain.user.controller;

import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.dto.response.UserResponse;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 사용자 관리 컨트롤러 (인증이 필요한 기능들)
 * 회원가입/로그인은 AuthController로 분리함
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /**
     * 모든 사용자 조회 (인증 필요)
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(Authentication authentication) {
        log.info("Getting all users requested by: {}", getCurrentUserEmail(authentication));

        List<UserResponse> responses = userRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        log.info("Found {} users", responses.size());
        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 사용자 조회 (인증 필요)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long userId, Authentication authentication) {
        log.info("Getting user: {} requested by: {}", userId, getCurrentUserEmail(authentication));

        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(convertToResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 현재 로그인한 사용자 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        log.info("Getting current user info: {}", currentUser.getEmail());

        return ResponseEntity.ok(convertToResponse(currentUser));
    }

    /**
     * 사용자 정보 수정 (본인만 가능)
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            @RequestBody UserUpdateRequest request,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        log.info("Updating user info: {}", currentUser.getEmail());

        // 수정 가능한 필드만 업데이트
        if (request.getName() != null) {
            currentUser.setName(request.getName());
        }
        if (request.getProfileImageUrl() != null) {
            currentUser.setProfileImageUrl(request.getProfileImageUrl());
        }

        User updatedUser = userRepository.save(currentUser);

        log.info("User info updated successfully: {}", updatedUser.getUserId());
        return ResponseEntity.ok(convertToResponse(updatedUser));
    }

    /**
     * 계정 비활성화 (본인만 가능) - 추간
     */
    @PutMapping("/me/deactivate")
    public ResponseEntity<Void> deactivateAccount(Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        log.info("Deactivating account: {}", currentUser.getEmail());

        currentUser.setIsActive(false);
        userRepository.save(currentUser);

        log.info("Account deactivated successfully: {}", currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    /**
     * 사용자 삭제 (관리자 기능 - 추후 ADMIN 역할 추가 시 사용)
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId, Authentication authentication) {
        log.info("Deleting user: {} requested by: {}", userId, getCurrentUserEmail(authentication));

        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(userId);
        log.info("User deleted successfully: {}", userId);
        return ResponseEntity.ok().build();
    }

    // === 헬퍼 메서드들 ===

    private User getAuthenticatedUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }

    private String getCurrentUserEmail(Authentication authentication) {
        return getAuthenticatedUser(authentication).getEmail();
    }

    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .userType(user.getUserType())
                .isActive(user.getIsActive())
                .build();
    }

    // === DTO 클래스 ===

    /**
     * 사용자 정보 수정 요청 DTO
     */
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserUpdateRequest {
        private String name;
        private String profileImageUrl;
    }
}