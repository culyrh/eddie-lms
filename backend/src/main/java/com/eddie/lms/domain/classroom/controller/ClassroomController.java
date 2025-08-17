package com.eddie.lms.domain.classroom.controller;

import com.eddie.lms.domain.classroom.entity.Classroom;
import com.eddie.lms.domain.classroom.entity.ClassroomMember;
import com.eddie.lms.domain.classroom.dto.request.ClassroomCreateRequest;
import com.eddie.lms.domain.classroom.dto.request.ClassroomJoinRequest;
import com.eddie.lms.domain.classroom.dto.response.ClassroomResponse;
import com.eddie.lms.domain.classroom.dto.response.ClassroomMemberResponse;
import com.eddie.lms.domain.classroom.repository.ClassroomRepository;
import com.eddie.lms.domain.classroom.repository.ClassroomMemberRepository;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 클래스룸 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomRepository classroomRepository;
    private final ClassroomMemberRepository classroomMemberRepository;
    private final UserRepository userRepository;

    /**
     * 클래스룸 생성 (교육자만 가능)
     */
    @PostMapping
    public ResponseEntity<ClassroomResponse> createClassroom(
            @RequestBody ClassroomCreateRequest request,
            @RequestParam Long educatorId) {

        log.info("Creating classroom: {} by educator: {}", request.getClassroomName(), educatorId);

        // 교육자 존재 여부 및 권한 확인
        User educator = userRepository.findById(educatorId).orElse(null);
        if (educator == null || educator.getUserType() != User.UserType.EDUCATOR) {
            return ResponseEntity.badRequest().build();
        }

        // 고유한 클래스룸 코드 생성
        String classroomCode = generateClassroomCode();

        // 클래스룸 생성
        Classroom newClassroom = Classroom.builder()
                .educatorId(educatorId)
                .classroomName(request.getClassroomName())
                .description(request.getDescription())
                .classroomCode(classroomCode)
                .isActive(true)
                .build();

        Classroom savedClassroom = classroomRepository.save(newClassroom);

        // 응답 생성
        ClassroomResponse response = convertToResponse(savedClassroom, educator);

        log.info("Classroom created successfully: {}", savedClassroom.getClassroomId());
        return ResponseEntity.ok(response);
    }

    /**
     * 클래스룸 참여 (학습자)
     */
    @PostMapping("/join")
    public ResponseEntity<ClassroomMemberResponse> joinClassroom(
            @RequestBody ClassroomJoinRequest request,
            @RequestParam Long userId) {

        log.info("User {} trying to join classroom with code: {}", userId, request.getClassroomCode());

        // 사용자 존재 여부 확인
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }

        // 클래스룸 코드로 클래스룸 찾기
        Classroom classroom = classroomRepository.findByClassroomCode(request.getClassroomCode()).orElse(null);
        if (classroom == null || !classroom.getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        // 이미 참여했는지 확인
        if (classroomMemberRepository.existsByClassroomIdAndUserId(classroom.getClassroomId(), userId)) {
            return ResponseEntity.badRequest().build();
        }

        // 멤버 추가
        ClassroomMember newMember = ClassroomMember.builder()
                .classroomId(classroom.getClassroomId())
                .userId(userId)
                .status(ClassroomMember.MemberStatus.ACTIVE)
                .build();

        ClassroomMember savedMember = classroomMemberRepository.save(newMember);

        // 응답 생성
        ClassroomMemberResponse response = convertToMemberResponse(savedMember, user);

        log.info("User {} joined classroom {} successfully", userId, classroom.getClassroomId());
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자가 참여한 클래스룸 목록 조회
     */
    @GetMapping("/my-classrooms")
    public ResponseEntity<List<ClassroomResponse>> getMyClassrooms(@RequestParam Long userId) {
        log.info("Getting classrooms for user: {}", userId);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }

        List<ClassroomResponse> responses;

        if (user.getUserType() == User.UserType.EDUCATOR) {
            // 교육자: 자신이 만든 클래스룸들
            responses = classroomRepository.findByEducatorIdAndIsActiveTrue(userId).stream()
                    .map(classroom -> convertToResponse(classroom, user))
                    .collect(Collectors.toList());
        } else {
            // 학습자: 참여한 클래스룸들
            List<Long> joinedClassroomIds = classroomMemberRepository
                    .findByUserIdAndStatus(userId, ClassroomMember.MemberStatus.ACTIVE).stream()
                    .map(ClassroomMember::getClassroomId)
                    .collect(Collectors.toList());

            responses = classroomRepository.findAllById(joinedClassroomIds).stream()
                    .filter(Classroom::getIsActive)
                    .map(classroom -> {
                        User educator = userRepository.findById(classroom.getEducatorId()).orElse(null);
                        return convertToResponse(classroom, educator);
                    })
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 클래스룸 정보 조회
     */
    @GetMapping("/{classroomId}")
    public ResponseEntity<ClassroomResponse> getClassroom(@PathVariable Long classroomId) {
        log.info("Getting classroom: {}", classroomId);

        return classroomRepository.findById(classroomId)
                .map(classroom -> {
                    User educator = userRepository.findById(classroom.getEducatorId()).orElse(null);
                    return ResponseEntity.ok(convertToResponse(classroom, educator));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 클래스룸 멤버 목록 조회
     */
    @GetMapping("/{classroomId}/members")
    public ResponseEntity<List<ClassroomMemberResponse>> getClassroomMembers(@PathVariable Long classroomId) {
        log.info("Getting members for classroom: {}", classroomId);

        List<ClassroomMemberResponse> responses = classroomMemberRepository
                .findByClassroomIdAndStatus(classroomId, ClassroomMember.MemberStatus.ACTIVE).stream()
                .map(member -> {
                    User user = userRepository.findById(member.getUserId()).orElse(null);
                    return convertToMemberResponse(member, user);
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // === 헬퍼 메서드들 ===

    private String generateClassroomCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private ClassroomResponse convertToResponse(Classroom classroom, User educator) {
        int memberCount = classroomMemberRepository
                .findByClassroomIdAndStatus(classroom.getClassroomId(), ClassroomMember.MemberStatus.ACTIVE)
                .size();

        return ClassroomResponse.builder()
                .classroomId(classroom.getClassroomId())
                .educatorId(classroom.getEducatorId())
                .educatorName(educator != null ? educator.getName() : "Unknown")
                .classroomName(classroom.getClassroomName())
                .description(classroom.getDescription())
                .classroomCode(classroom.getClassroomCode())
                .isActive(classroom.getIsActive())
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .memberCount(memberCount)
                .build();
    }

    private ClassroomMemberResponse convertToMemberResponse(ClassroomMember member, User user) {
        return ClassroomMemberResponse.builder()
                .memberId(member.getMemberId())
                .userId(member.getUserId())
                .userName(user != null ? user.getName() : "Unknown")
                .userEmail(user != null ? user.getEmail() : "Unknown")
                .userType(user != null ? user.getUserType() : null)
                .status(member.getStatus())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}