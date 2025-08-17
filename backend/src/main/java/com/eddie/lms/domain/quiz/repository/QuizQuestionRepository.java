package com.eddie.lms.domain.quiz.repository;

import com.eddie.lms.domain.quiz.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizIdOrderByOrderIndex(Long quizId);
    void deleteByQuizId(Long quizId);
}