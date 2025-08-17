package com.eddie.lms.domain.board.controller;

import com.eddie.lms.domain.board.entity.BoardPost;
import com.eddie.lms.domain.board.entity.BoardComment;
import com.eddie.lms.domain.board.dto.request.PostCreateRequest;
import com.eddie.lms.domain.board.dto.request.PostUpdateRequest;
import com.eddie.lms.domain.board.dto.request.CommentCreateRequest;
import com.eddie.lms.domain.board.dto.response.PostResponse;
import com.eddie.lms.domain.board.dto.response.PostDetailResponse;
import com.eddie.lms.domain.board.dto.response.CommentResponse;
import com.eddie.lms.domain.board.repository.BoardPostRepository;
import com.eddie.lms.domain.board.repository.BoardCommentRepository;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 게시판 관리 컨트롤러
 * 클래스룸별 게시판 CRUD + 검색 기능
 */
@Slf4j
@RestController
@RequestMapping("/api/classrooms/{classroomId}/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardPostRepository boardPostRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final UserRepository userRepository;

    /**
     * 게시글 생성
     */
    @PostMapping("/posts")
    public ResponseEntity<PostResponse> createPost(
            @PathVariable Long classroomId,
            @RequestBody PostCreateRequest request,
            @RequestParam Long authorId) {

        log.info("Creating post in classroom: {} by user: {}", classroomId, authorId);

        // 작성자 존재 여부 확인
        User author = userRepository.findById(authorId).orElse(null);
        if (author == null) {
            return ResponseEntity.badRequest().build();
        }

        // 게시글 생성
        BoardPost newPost = BoardPost.builder()
                .classroomId(classroomId)
                .authorId(authorId)
                .title(request.getTitle())
                .content(request.getContent())
                .isDeleted(false)
                .build();

        BoardPost savedPost = boardPostRepository.save(newPost);

        // 응답 생성
        PostResponse response = convertToPostResponse(savedPost, author);

        log.info("Post created successfully: {}", savedPost.getPostId());
        return ResponseEntity.ok(response);
    }

    /**
     * 클래스룸 게시글 목록 조회 (검색 기능 포함)
     */
    @GetMapping("/posts")
    public ResponseEntity<List<PostResponse>> getPosts(
            @PathVariable Long classroomId,
            @RequestParam(required = false) String search) {

        log.info("Getting posts for classroom: {}, search: {}", classroomId, search);

        List<BoardPost> posts;

        if (search != null && !search.trim().isEmpty()) {
            posts = boardPostRepository.findByClassroomIdAndSearchTerm(classroomId, search);
        } else {
            posts = boardPostRepository.findByClassroomIdAndIsDeletedFalseOrderByCreatedAtDesc(classroomId);
        }

        List<PostResponse> responses = posts.stream()
                .map(post -> {
                    User author = userRepository.findById(post.getAuthorId()).orElse(null);
                    return convertToPostResponse(post, author);
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 게시글 상세 조회 (댓글 포함)
     */
    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDetailResponse> getPost(
            @PathVariable Long classroomId,
            @PathVariable Long postId) {

        log.info("Getting post: {} in classroom: {}", postId, classroomId);

        BoardPost post = boardPostRepository.findById(postId).orElse(null);

        if (post == null || !post.getClassroomId().equals(classroomId) || post.getIsDeleted()) {
            return ResponseEntity.notFound().build();
        }

        // 해당 게시글의 댓글들 조회
        List<CommentResponse> commentResponses = boardCommentRepository
                .findByPostIdAndIsDeletedFalseOrderByCreatedAt(postId).stream()
                .map(comment -> {
                    User commentAuthor = userRepository.findById(comment.getAuthorId()).orElse(null);
                    return convertToCommentResponse(comment, commentAuthor);
                })
                .collect(Collectors.toList());

        User author = userRepository.findById(post.getAuthorId()).orElse(null);

        PostDetailResponse response = PostDetailResponse.builder()
                .postId(post.getPostId())
                .classroomId(post.getClassroomId())
                .authorId(post.getAuthorId())
                .authorName(author != null ? author.getName() : "Unknown")
                .title(post.getTitle())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .comments(commentResponses)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 게시글 수정
     */
    @PutMapping("/posts/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @RequestBody PostUpdateRequest request,
            @RequestParam Long authorId) {

        log.info("Updating post: {} by user: {}", postId, authorId);

        BoardPost post = boardPostRepository.findById(postId).orElse(null);

        if (post == null || !post.getClassroomId().equals(classroomId) || post.getIsDeleted()) {
            return ResponseEntity.notFound().build();
        }

        // 작성자만 수정 가능
        if (!post.getAuthorId().equals(authorId)) {
            return ResponseEntity.badRequest().build();
        }

        // 게시글 수정
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());

        BoardPost updatedPost = boardPostRepository.save(post);
        User author = userRepository.findById(authorId).orElse(null);

        PostResponse response = convertToPostResponse(updatedPost, author);

        log.info("Post updated successfully: {}", postId);
        return ResponseEntity.ok(response);
    }

    /**
     * 게시글 삭제 (논리 삭제)
     */
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @RequestParam Long authorId) {

        log.info("Deleting post: {} by user: {}", postId, authorId);

        BoardPost post = boardPostRepository.findById(postId).orElse(null);

        if (post == null || !post.getClassroomId().equals(classroomId) || post.getIsDeleted()) {
            return ResponseEntity.notFound().build();
        }

        // 작성자만 삭제 가능
        if (!post.getAuthorId().equals(authorId)) {
            return ResponseEntity.badRequest().build();
        }

        // 논리 삭제
        post.setIsDeleted(true);
        boardPostRepository.save(post);

        log.info("Post deleted successfully: {}", postId);
        return ResponseEntity.ok().build();
    }

    /**
     * 댓글 생성
     */
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @RequestBody CommentCreateRequest request,
            @RequestParam Long authorId) {

        log.info("Creating comment on post: {} by user: {}", postId, authorId);

        // 게시글 존재 여부 확인
        BoardPost post = boardPostRepository.findById(postId).orElse(null);
        if (post == null || !post.getClassroomId().equals(classroomId) || post.getIsDeleted()) {
            return ResponseEntity.notFound().build();
        }

        // 작성자 존재 여부 확인
        User author = userRepository.findById(authorId).orElse(null);
        if (author == null) {
            return ResponseEntity.badRequest().build();
        }

        // 댓글 생성
        BoardComment newComment = BoardComment.builder()
                .postId(postId)
                .authorId(authorId)
                .content(request.getContent())
                .isDeleted(false)
                .build();

        BoardComment savedComment = boardCommentRepository.save(newComment);
        CommentResponse response = convertToCommentResponse(savedComment, author);

        log.info("Comment created successfully: {}", savedComment.getCommentId());
        return ResponseEntity.ok(response);
    }

    /**
     * 댓글 삭제
     */
    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam Long authorId) {

        log.info("Deleting comment: {} by user: {}", commentId, authorId);

        BoardComment comment = boardCommentRepository.findById(commentId).orElse(null);

        if (comment == null || !comment.getPostId().equals(postId) || comment.getIsDeleted()) {
            return ResponseEntity.notFound().build();
        }

        // 작성자만 삭제 가능
        if (!comment.getAuthorId().equals(authorId)) {
            return ResponseEntity.badRequest().build();
        }

        // 논리 삭제
        comment.setIsDeleted(true);
        boardCommentRepository.save(comment);

        log.info("Comment deleted successfully: {}", commentId);
        return ResponseEntity.ok().build();
    }

    // === 헬퍼 메서드들 ===

    private PostResponse convertToPostResponse(BoardPost post, User author) {
        int commentCount = boardCommentRepository.countByPostIdAndIsDeletedFalse(post.getPostId());

        return PostResponse.builder()
                .postId(post.getPostId())
                .classroomId(post.getClassroomId())
                .authorId(post.getAuthorId())
                .authorName(author != null ? author.getName() : "Unknown")
                .title(post.getTitle())
                .content(post.getContent())
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private CommentResponse convertToCommentResponse(BoardComment comment, User author) {
        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .postId(comment.getPostId())
                .authorId(comment.getAuthorId())
                .authorName(author != null ? author.getName() : "Unknown")
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}