package com.eddie.lms.domain.classroom.controller;

import com.eddie.lms.domain.classroom.dto.request.ClassroomCreateRequest;
import com.eddie.lms.domain.classroom.dto.request.ClassroomJoinRequest;
import com.eddie.lms.domain.classroom.dto.response.ClassroomResponse;
import com.eddie.lms.domain.classroom.dto.response.ClassroomMemberResponse;
import com.eddie.lms.domain.classroom.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 클래스룸 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    /**
     * 클래스룸 생성 (교육자만 가능)
     */
    @PostMapping
    public ResponseEntity<ClassroomResponse> createClassroom(
            @RequestBody ClassroomCreateRequest request,
            @RequestParam Long educatorId) {

        log.info("POST /api/classrooms - educator: {}, name: {}", educatorId, request.getClassroomName());

        try {
            ClassroomResponse response = classroomService.createClassroom(educatorId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create classroom: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to create classroom by educator: {}", educatorId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 클래스룸 참가
     */
    @PostMapping("/join")
    public ResponseEntity<ClassroomResponse> joinClassroom(
            @RequestBody ClassroomJoinRequest request,
            @RequestParam Long userId) {

        log.info("POST /api/classrooms/join - user: {}, code: {}", userId, request.getClassroomCode());

        try {
            ClassroomResponse response = classroomService.joinClassroom(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to join classroom: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to join classroom by user: {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자의 클래스룸 목록 조회
     */
    @GetMapping("/my-classrooms")
    public ResponseEntity<List<ClassroomResponse>> getMyClassrooms(@RequestParam Long userId) {
        log.info("GET /api/classrooms/my-classrooms - user: {}", userId);

        try {
            List<ClassroomResponse> classrooms = classroomService.getMyClassrooms(userId);
            return ResponseEntity.ok(classrooms);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to get user classrooms: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to get classrooms for user: {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 클래스룸 정보 조회
     */
    @GetMapping("/{classroomId}")
    public ResponseEntity<ClassroomResponse> getClassroom(@PathVariable Long classroomId) {
        log.info("GET /api/classrooms/{}", classroomId);

        try {
            ClassroomResponse classroom = classroomService.getClassroom(classroomId);
            return ResponseEntity.ok(classroom);
        } catch (IllegalArgumentException e) {
            log.warn("Classroom not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to get classroom: {}", classroomId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 클래스룸 멤버 목록 조회
     */
    @GetMapping("/{classroomId}/members")
    public ResponseEntity<List<ClassroomMemberResponse>> getClassroomMembers(@PathVariable Long classroomId) {
        log.info("GET /api/classrooms/{}/members", classroomId);

        try {
            List<ClassroomMemberResponse> members = classroomService.getClassroomMembers(classroomId);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Failed to get classroom members for: {}", classroomId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}