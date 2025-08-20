package com.eddie.lms.domain.user.service;

import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.dto.response.UserResponse;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 사용자 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /**
     * 모든 사용자 조회
     */
    public List<UserResponse> getAllUsers() {
        log.info("Fetching all users");

        List<User> users = userRepository.findAll();

        return users.stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * 특정 사용자 조회
     */
    public UserResponse getUser(Long userId) {
        log.info("Fetching user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return convertToUserResponse(user);
    }

    /**
     * 현재 로그인한 사용자 정보 조회
     */
    public UserResponse getCurrentUser(User currentUser) {
        log.info("Fetching current user info: {}", currentUser.getEmail());

        return convertToUserResponse(currentUser);
    }

    /**
     * 사용자 정보 수정
     */
    @Transactional
    public UserResponse updateUser(User currentUser, UserUpdateRequest request) {
        log.info("Updating user: {}", currentUser.getEmail());

        // 사용자 정보 수정
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            currentUser.setName(request.getName().trim());
        }

        if (request.getProfileImageUrl() != null) {
            currentUser.setProfileImageUrl(request.getProfileImageUrl());
        }

        User updatedUser = userRepository.save(currentUser);
        return convertToUserResponse(updatedUser);
    }

    /**
     * 사용자 삭제 (관리자 기능)
     */
    @Transactional
    public void deleteUser(Long userId) {
        log.info("Deleting user: {}", userId);

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        userRepository.deleteById(userId);
        log.info("User deleted successfully: {}", userId);
    }

    /**
     * 사용자 존재 여부 확인
     */
    public boolean existsById(Long userId) {
        return userRepository.existsById(userId);
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