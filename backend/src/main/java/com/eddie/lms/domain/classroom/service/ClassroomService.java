package com.eddie.lms.domain.classroom.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 클래스룸 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomMemberRepository classroomMemberRepository;
    private final UserRepository userRepository;

    /**
     * 클래스룸 생성 (교육자만 가능)
     */
    @Transactional
    public ClassroomResponse createClassroom(Long educatorId, ClassroomCreateRequest request) {
        log.info("Creating classroom: {} by educator: {}", request.getClassroomName(), educatorId);

        // 교육자 존재 여부 및 권한 확인
        User educator = userRepository.findById(educatorId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (educator.getUserType() != User.UserType.EDUCATOR) {
            throw new IllegalArgumentException("교육자만 클래스룸을 생성할 수 있습니다.");
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

        log.info("Classroom created successfully: {}", savedClassroom.getClassroomId());
        return convertToClassroomResponse(savedClassroom, educator);
    }

    /**
     * 클래스룸 참가
     */
    @Transactional
    public ClassroomResponse joinClassroom(Long userId, ClassroomJoinRequest request) {
        log.info("User {} joining classroom with code: {}", userId, request.getClassroomCode());

        // 사용자 존재 여부 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 클래스룸 코드로 클래스룸 찾기
        Classroom classroom = classroomRepository.findByClassroomCode(request.getClassroomCode())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 클래스룸 코드입니다."));

        if (!classroom.getIsActive()) {
            throw new IllegalArgumentException("비활성화된 클래스룸입니다.");
        }

        // 이미 참가한 사용자인지 확인
        boolean alreadyJoined = classroomMemberRepository.existsByClassroomIdAndUserId(
                classroom.getClassroomId(), userId);

        if (alreadyJoined) {
            throw new IllegalArgumentException("이미 참가한 클래스룸입니다.");
        }

        // 멤버 추가
        ClassroomMember newMember = ClassroomMember.builder()
                .classroomId(classroom.getClassroomId())
                .userId(userId)
                .status(ClassroomMember.MemberStatus.ACTIVE)
                .build();

        classroomMemberRepository.save(newMember);

        User educator = userRepository.findById(classroom.getEducatorId()).orElse(null);

        log.info("User {} successfully joined classroom: {}", userId, classroom.getClassroomId());
        return convertToClassroomResponse(classroom, educator);
    }

    /**
     * 사용자의 클래스룸 목록 조회
     */
    public List<ClassroomResponse> getMyClassrooms(Long userId) {
        log.info("Getting classrooms for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (user.getUserType() == User.UserType.EDUCATOR) {
            // 교육자: 자신이 만든 클래스룸들
            return classroomRepository.findByEducatorIdAndIsActiveTrue(userId).stream()
                    .map(classroom -> convertToClassroomResponse(classroom, user))
                    .collect(Collectors.toList());
        } else {
            // 학습자: 참여한 클래스룸들
            List<Long> joinedClassroomIds = classroomMemberRepository
                    .findByUserIdAndStatus(userId, ClassroomMember.MemberStatus.ACTIVE).stream()
                    .map(ClassroomMember::getClassroomId)
                    .collect(Collectors.toList());

            return classroomRepository.findAllById(joinedClassroomIds).stream()
                    .filter(Classroom::getIsActive)
                    .map(classroom -> {
                        User educator = userRepository.findById(classroom.getEducatorId()).orElse(null);
                        return convertToClassroomResponse(classroom, educator);
                    })
                    .collect(Collectors.toList());
        }
    }

    /**
     * 특정 클래스룸 정보 조회
     */
    public ClassroomResponse getClassroom(Long classroomId) {
        log.info("Getting classroom: {}", classroomId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("클래스룸을 찾을 수 없습니다."));

        User educator = userRepository.findById(classroom.getEducatorId()).orElse(null);
        return convertToClassroomResponse(classroom, educator);
    }

    /**
     * 클래스룸 멤버 목록 조회
     */
    public List<ClassroomMemberResponse> getClassroomMembers(Long classroomId) {
        log.info("Getting members for classroom: {}", classroomId);

        return classroomMemberRepository
                .findByClassroomIdAndStatus(classroomId, ClassroomMember.MemberStatus.ACTIVE).stream()
                .map(member -> {
                    User user = userRepository.findById(member.getUserId()).orElse(null);
                    return convertToClassroomMemberResponse(member, user);
                })
                .collect(Collectors.toList());
    }

    /**
     * 클래스룸 존재 여부 확인
     */
    public boolean existsById(Long classroomId) {
        return classroomRepository.existsById(classroomId);
    }

    /**
     * 고유한 클래스룸 코드 생성
     */
    private String generateClassroomCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /**
     * Classroom 엔티티를 ClassroomResponse DTO로 변환
     */
    private ClassroomResponse convertToClassroomResponse(Classroom classroom, User educator) {
        int memberCount = classroomMemberRepository
                .findByClassroomIdAndStatus(classroom.getClassroomId(), ClassroomMember.MemberStatus.ACTIVE)
                .size();

        return ClassroomResponse.builder()
                .classroomId(classroom.getClassroomId())
                .educatorId(classroom.getEducatorId())
                .educatorName(educator != null ? educator.getName() : "알 수 없음")
                .classroomName(classroom.getClassroomName())
                .description(classroom.getDescription())
                .classroomCode(classroom.getClassroomCode())
                .isActive(classroom.getIsActive())
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .memberCount(memberCount)
                .build();
    }

    /**
     * ClassroomMember 엔티티를 ClassroomMemberResponse DTO로 변환
     */
    private ClassroomMemberResponse convertToClassroomMemberResponse(ClassroomMember member, User user) {
        return ClassroomMemberResponse.builder()
                .memberId(member.getMemberId())
                .userId(member.getUserId())
                .userName(user != null ? user.getName() : "알 수 없음")
                .userEmail(user != null ? user.getEmail() : "알 수 없음")
                .userType(user != null ? user.getUserType() : null)
                .status(member.getStatus())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}