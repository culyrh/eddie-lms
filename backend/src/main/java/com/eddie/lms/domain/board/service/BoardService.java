package com.eddie.lms.domain.board.service;

import com.eddie.lms.domain.board.dto.request.CommentCreateRequest;
import com.eddie.lms.domain.board.dto.request.PostCreateRequest;
import com.eddie.lms.domain.board.dto.request.PostUpdateRequest;
import com.eddie.lms.domain.board.dto.response.CommentResponse;
import com.eddie.lms.domain.board.dto.response.PostDetailResponse;
import com.eddie.lms.domain.board.dto.response.PostResponse;
import com.eddie.lms.domain.board.entity.BoardComment;
import com.eddie.lms.domain.board.entity.BoardPost;
import com.eddie.lms.domain.board.repository.BoardCommentRepository;
import com.eddie.lms.domain.board.repository.BoardPostRepository;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

    private final BoardPostRepository boardPostRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final UserRepository userRepository;

    // ===== 게시글 =====

    @Transactional
    public PostResponse createPost(Long classroomId, PostCreateRequest request, Long authorId) {
        log.info("Creating post in classroom: {} by user: {}", classroomId, authorId);

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자를 찾을 수 없습니다: " + authorId));

        BoardPost saved = boardPostRepository.save(
                BoardPost.builder()
                        .classroomId(classroomId)
                        .authorId(authorId)
                        .title(request.getTitle())
                        .content(request.getContent())
                        .isDeleted(false)
                        .build()
        );

        return toPostResponse(saved, author);
    }

    public List<PostResponse> getPosts(Long classroomId, String search) {
        log.info("Getting posts for classroom: {}, search: {}", classroomId, search);

        List<BoardPost> posts = (search != null && !search.trim().isEmpty())
                ? boardPostRepository.findByClassroomIdAndSearchTerm(classroomId, search)
                : boardPostRepository.findByClassroomIdAndIsDeletedFalseOrderByCreatedAtDesc(classroomId);

        return posts.stream()
                .map(p -> {
                    User author = userRepository.findById(p.getAuthorId()).orElse(null);
                    return toPostResponse(p, author);
                })
                .collect(Collectors.toList());
    }

    public PostDetailResponse getPost(Long classroomId, Long postId) {
        log.info("Getting post: {} in classroom: {}", postId, classroomId);

        BoardPost post = getPostOr404(postId);
        validateSameClassroom(post.getClassroomId(), classroomId);
        ensureNotDeleted(post.getIsDeleted());

        List<CommentResponse> comments = boardCommentRepository
                .findByPostIdAndIsDeletedFalseOrderByCreatedAt(postId).stream()
                .map(c -> {
                    User u = userRepository.findById(c.getAuthorId()).orElse(null);
                    return toCommentResponse(c, u);
                })
                .toList();

        User author = userRepository.findById(post.getAuthorId()).orElse(null);

        return PostDetailResponse.builder()
                .postId(post.getPostId())
                .classroomId(post.getClassroomId())
                .authorId(post.getAuthorId())
                .authorName(author != null ? author.getName() : "Unknown")
                .title(post.getTitle())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .comments(comments)
                .build();
    }

    @Transactional
    public PostResponse updatePost(Long classroomId, Long postId, PostUpdateRequest request, Long authorId) {
        log.info("Updating post: {} by user: {}", postId, authorId);

        BoardPost post = getPostOr404(postId);
        validateSameClassroom(post.getClassroomId(), classroomId);
        ensureNotDeleted(post.getIsDeleted());
        ensureAuthor(post.getAuthorId(), authorId);

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        BoardPost updated = boardPostRepository.save(post);

        User author = userRepository.findById(authorId).orElse(null);
        return toPostResponse(updated, author);
    }

    @Transactional
    public void deletePost(Long classroomId, Long postId, Long authorId) {
        log.info("Deleting post: {} by user: {}", postId, authorId);

        BoardPost post = getPostOr404(postId);
        validateSameClassroom(post.getClassroomId(), classroomId);
        ensureNotDeleted(post.getIsDeleted());
        ensureAuthor(post.getAuthorId(), authorId);

        post.setIsDeleted(true); // 논리 삭제
        boardPostRepository.save(post);
    }

    // ===== 댓글 =====

    @Transactional
    public CommentResponse createComment(Long classroomId, Long postId, CommentCreateRequest request, Long authorId) {
        log.info("Creating comment on post: {} by user: {}", postId, authorId);

        BoardPost post = getPostOr404(postId);
        validateSameClassroom(post.getClassroomId(), classroomId);
        ensureNotDeleted(post.getIsDeleted());

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자를 찾을 수 없습니다: " + authorId));

        BoardComment saved = boardCommentRepository.save(
                BoardComment.builder()
                        .postId(postId)
                        .authorId(authorId)
                        .content(request.getContent())
                        .isDeleted(false)
                        .build()
        );

        return toCommentResponse(saved, author);
    }

    @Transactional
    public void deleteComment(Long classroomId, Long postId, Long commentId, Long authorId) {
        log.info("Deleting comment: {} by user: {}", commentId, authorId);

        BoardPost post = getPostOr404(postId);
        validateSameClassroom(post.getClassroomId(), classroomId);
        ensureNotDeleted(post.getIsDeleted());

        BoardComment comment = boardCommentRepository.findById(commentId).orElse(null);
        if (comment == null || !comment.getPostId().equals(postId) || Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다.");
        }

        ensureAuthor(comment.getAuthorId(), authorId);

        comment.setIsDeleted(true); // 논리 삭제
        boardCommentRepository.save(comment);
    }

    // ===== 변환 헬퍼 =====

    private PostResponse toPostResponse(BoardPost post, User author) {
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

    private CommentResponse toCommentResponse(BoardComment c, User author) {
        return CommentResponse.builder()
                .commentId(c.getCommentId())
                .postId(c.getPostId())
                .authorId(c.getAuthorId())
                .authorName(author != null ? author.getName() : "Unknown")
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    // ===== 검증/조회 헬퍼 =====

    private BoardPost getPostOr404(Long postId) {
        BoardPost p = boardPostRepository.findById(postId).orElse(null);
        if (p == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다: " + postId);
        return p;
    }

    private void validateSameClassroom(Long entityClassroomId, Long classroomId) {
        if (!entityClassroomId.equals(classroomId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "클래스룸이 일치하지 않습니다.");
        }
    }

    private void ensureNotDeleted(Boolean isDeleted) {
        if (Boolean.TRUE.equals(isDeleted)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제된 리소스입니다.");
        }
    }

    private void ensureAuthor(Long ownerId, Long requesterId) {
        if (!ownerId.equals(requesterId)) {
            throw new AccessDeniedException("작성자만 수행할 수 있습니다.");
        }
    }
}
