package com.eddie.lms.domain.quiz.repository;

import com.eddie.lms.domain.quiz.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
    List<Quiz> findByCreatorId(Long creatorId);
}