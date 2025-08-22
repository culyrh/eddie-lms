package com.eddie.lms.domain.board.controller;

import com.eddie.lms.domain.board.service.BoardService;
import com.eddie.lms.domain.board.dto.request.CommentCreateRequest;
import com.eddie.lms.domain.board.dto.request.PostCreateRequest;
import com.eddie.lms.domain.board.dto.request.PostUpdateRequest;
import com.eddie.lms.domain.board.dto.response.CommentResponse;
import com.eddie.lms.domain.board.dto.response.PostDetailResponse;
import com.eddie.lms.domain.board.dto.response.PostResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 게시판 관리 컨트롤러 (요청/응답만 담당)
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms/{classroomId}/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    /** 게시글 생성 */
    @PostMapping("/posts")
    public ResponseEntity<PostResponse> createPost(
            @PathVariable Long classroomId,
            @RequestBody PostCreateRequest request,
            @RequestParam Long authorId) {

        return ResponseEntity.ok(
                boardService.createPost(classroomId, request, authorId)
        );
    }

    /** 게시글 목록 조회 (검색 포함) */
    @GetMapping("/posts")
    public ResponseEntity<List<PostResponse>> getPosts(
            @PathVariable Long classroomId,
            @RequestParam(required = false) String search) {

        return ResponseEntity.ok(
                boardService.getPosts(classroomId, search)
        );
    }

    /** 게시글 상세 (댓글 포함) */
    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDetailResponse> getPost(
            @PathVariable Long classroomId,
            @PathVariable Long postId) {

        return ResponseEntity.ok(
                boardService.getPost(classroomId, postId)
        );
    }

    /** 게시글 수정 */
    @PutMapping("/posts/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @RequestBody PostUpdateRequest request,
            @RequestParam Long authorId) {

        return ResponseEntity.ok(
                boardService.updatePost(classroomId, postId, request, authorId)
        );
    }

    /** 게시글 삭제(논리 삭제) */
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @RequestParam Long authorId) {

        boardService.deletePost(classroomId, postId, authorId);
        return ResponseEntity.ok().build(); // 기존 동작 유지
    }

    /** 댓글 생성 */
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @RequestBody CommentCreateRequest request,
            @RequestParam Long authorId) {

        return ResponseEntity.ok(
                boardService.createComment(classroomId, postId, request, authorId)
        );
    }

    /** 댓글 삭제(논리 삭제) */
    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam Long authorId) {

        boardService.deleteComment(classroomId, postId, commentId, authorId);
        return ResponseEntity.ok().build(); // 기존 동작 유지
    }
}
