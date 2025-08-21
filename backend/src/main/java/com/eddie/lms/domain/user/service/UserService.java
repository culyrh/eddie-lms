package com.eddie.lms.domain.user.service;

import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.dto.response.UserResponse;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
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

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.url:http://localhost:8080/uploads}")
    private String uploadUrl;

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
     * 프로필 이미지 업로드
     */
    @Transactional
    public String uploadProfileImage(User currentUser, MultipartFile file) {
        log.info("Uploading profile image for user: {}", currentUser.getEmail());

        try {
            // 업로드 디렉토리 생성
            Path uploadPath = Paths.get(uploadDir, "profiles");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 파일명 생성 (UUID + 원본 확장자)
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;

            // 파일 저장
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 기존 프로필 이미지 삭제 (새 이미지로 교체 시)
            deleteOldProfileImage(currentUser);

            // 접근 가능한 URL 생성
            String imageUrl = uploadUrl + "/profiles/" + fileName;

            // 사용자 프로필 이미지 URL 업데이트
            currentUser.setProfileImageUrl(imageUrl);
            userRepository.save(currentUser);

            log.info("Profile image uploaded successfully: {}", imageUrl);
            return imageUrl;

        } catch (IOException e) {
            log.error("Failed to upload profile image", e);
            throw new RuntimeException("프로필 이미지 업로드에 실패했습니다.", e);
        }
    }

    /**
     * 프로필 이미지 삭제
     */
    @Transactional
    public void deleteProfileImage(User currentUser) {
        log.info("Deleting profile image for user: {}", currentUser.getEmail());

        // 기존 프로필 이미지 파일 삭제
        deleteOldProfileImage(currentUser);

        // 사용자 프로필 이미지 URL 제거
        currentUser.setProfileImageUrl(null);
        userRepository.save(currentUser);

        log.info("Profile image deleted successfully for user: {}", currentUser.getEmail());
    }

    /**
     * 기존 프로필 이미지 파일 삭제
     */
    private void deleteOldProfileImage(User user) {
        String oldImageUrl = user.getProfileImageUrl();
        if (oldImageUrl != null && oldImageUrl.startsWith(uploadUrl)) {
            try {
                // URL에서 파일명 추출
                String fileName = oldImageUrl.substring(oldImageUrl.lastIndexOf("/") + 1);
                Path oldFilePath = Paths.get(uploadDir, "profiles", fileName);

                if (Files.exists(oldFilePath)) {
                    Files.delete(oldFilePath);
                    log.info("Old profile image deleted: {}", oldFilePath);
                }
            } catch (IOException e) {
                log.warn("Failed to delete old profile image: {}", oldImageUrl, e);
            }
        }
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