package com.eddie.lms.domain.quiz.repository;

import com.eddie.lms.domain.quiz.entity.QuizAnswerRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAnswerRecordRepository extends JpaRepository<QuizAnswerRecord, Long> {
    List<QuizAnswerRecord> findByQuizIdAndStudentId(Long quizId, Long studentId);
    List<QuizAnswerRecord> findByQuizId(Long quizId);
    boolean existsByQuizIdAndStudentId(Long quizId, Long studentId);

    @Query("SELECT SUM(qr.isCorrect) FROM QuizAnswerRecord qr WHERE qr.quizId = :quizId AND qr.studentId = :studentId")
    Optional<Integer> getCorrectAnswerCount(@Param("quizId") Long quizId, @Param("studentId") Long studentId);

    @Query("SELECT COUNT(DISTINCT qr.studentId) FROM QuizAnswerRecord qr WHERE qr.quizId = :quizId")
    int countDistinctStudentsByQuizId(@Param("quizId") Long quizId);
}