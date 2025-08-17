package com.eddie.lms.domain.board.repository;

import com.eddie.lms.domain.board.entity.BoardPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BoardPostRepository extends JpaRepository<BoardPost, Long> {
    List<BoardPost> findByClassroomIdAndIsDeletedFalseOrderByCreatedAtDesc(Long classroomId);

    @Query("SELECT p FROM BoardPost p WHERE p.classroomId = :classroomId AND p.isDeleted = false " +
            "AND (p.title LIKE %:search% OR p.content LIKE %:search%) ORDER BY p.createdAt DESC")
    List<BoardPost> findByClassroomIdAndSearchTerm(@Param("classroomId") Long classroomId,
                                                   @Param("search") String search);
}