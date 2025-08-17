package com.eddie.lms.domain.board.repository;

import com.eddie.lms.domain.board.entity.BoardComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {
    List<BoardComment> findByPostIdAndIsDeletedFalseOrderByCreatedAt(Long postId);
    int countByPostIdAndIsDeletedFalse(Long postId);
}