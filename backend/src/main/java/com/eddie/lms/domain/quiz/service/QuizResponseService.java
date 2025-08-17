package com.eddie.lms.domain.quiz.service;

import com.eddie.lms.domain.quiz.dto.response.*;
import com.eddie.lms.domain.quiz.entity.Quiz;
import com.eddie.lms.domain.quiz.entity.QuizAnswerRecord;
import com.eddie.lms.domain.quiz.entity.QuizQuestion;
import com.eddie.lms.domain.quiz.entity.QuizSession;
import com.eddie.lms.domain.quiz.repository.QuizAnswerRecordRepository;
import com.eddie.lms.domain.quiz.repository.QuizQuestionRepository;
import com.eddie.lms.domain.quiz.repository.QuizSessionRepository;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 퀴즈 응답 변환 서비스
 */
@Service
@RequiredArgsConstructor
public class QuizResponseService {

    private final QuizQuestionRepository questionRepository;
    private final QuizAnswerRecordRepository responseRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final UserRepository userRepository;

    public QuizResponse convertToQuizResponse(Quiz quiz, User creator, User requestUser) {
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndex(quiz.getQuizId());
        int totalPoints = questions.stream().mapToInt(QuizQuestion::getPoints).sum();
        int participantCount = responseRepository.countDistinctStudentsByQuizId(quiz.getQuizId());

        return QuizResponse.builder()
                .quizId(quiz.getQuizId())
                .classroomId(quiz.getClassroomId())
                .creatorId(quiz.getCreatorId())
                .creatorName(creator != null ? creator.getName() : "Unknown")
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .startTime(quiz.getStartTime())
                .endTime(quiz.getEndTime())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .totalQuestions(questions.size())
                .totalPoints(totalPoints)
                .participantCount(participantCount)
                .status(getQuizStatus(quiz))
                .hasSubmitted(checkSubmissionStatus(quiz, requestUser))
                .build();
    }

    public QuizDetailResponse convertToQuizDetailResponse(Quiz quiz, User requestUser) {
        User creator = userRepository.findById(quiz.getCreatorId()).orElse(null);
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndex(quiz.getQuizId());
        int totalPoints = questions.stream().mapToInt(QuizQuestion::getPoints).sum();
        int participantCount = responseRepository.countDistinctStudentsByQuizId(quiz.getQuizId());

        return QuizDetailResponse.builder()
                .quizId(quiz.getQuizId())
                .classroomId(quiz.getClassroomId())
                .creatorId(quiz.getCreatorId())
                .creatorName(creator != null ? creator.getName() : "Unknown")
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .startTime(quiz.getStartTime())
                .endTime(quiz.getEndTime())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .totalQuestions(questions.size())
                .totalPoints(totalPoints)
                .participantCount(participantCount)
                .status(getQuizStatus(quiz))
                .questions(buildQuestionResponses(questions, requestUser, quiz))
                .hasSubmitted(checkSubmissionStatus(quiz, requestUser))
                .build();
    }

    public QuizResultResponse generateQuizResult(Quiz quiz, User student,
                                                 List<QuizQuestion> questions,
                                                 List<QuizAnswerRecord> responses) {

        int correctAnswers = (int) responses.stream().mapToLong(r -> r.getIsCorrect() ? 1 : 0).sum();
        int earnedPoints = calculateEarnedPoints(questions, responses);
        double percentage = questions.size() > 0 ? (double) correctAnswers / questions.size() * 100 : 0;

        LocalDateTime submittedAt = responses.stream()
                .map(QuizAnswerRecord::getAnsweredAt)
                .max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

        return QuizResultResponse.builder()
                .quizId(quiz.getQuizId())
                .studentId(student.getUserId())
                .studentName(student.getName())
                .quizTitle(quiz.getTitle())
                .totalQuestions(questions.size())
                .correctAnswers(correctAnswers)
                .totalPoints(questions.stream().mapToInt(QuizQuestion::getPoints).sum())
                .earnedPoints(earnedPoints)
                .percentage(percentage)
                .submittedAt(submittedAt)
                .answerResults(buildAnswerResults(questions, responses))
                .build();
    }

    public QuizResultResponse generateDropoutResult(Quiz quiz, User student,
                                                    List<QuizQuestion> questions,
                                                    QuizSession session) {
        List<QuizResultResponse.AnswerResultResponse> answerResults = questions.stream()
                .map(question -> QuizResultResponse.AnswerResultResponse.builder()
                        .questionId(question.getQuestionId())
                        .questionText(question.getQuestionText())
                        .studentAnswer("")
                        .correctAnswer(question.getCorrectAnswer())
                        .isCorrect(false)
                        .points(question.getPoints())
                        .answeredAt(session.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return QuizResultResponse.builder()
                .quizId(quiz.getQuizId())
                .quizTitle(quiz.getTitle())
                .studentId(student.getUserId())
                .studentName(student.getName())
                .totalQuestions(questions.size())
                .correctAnswers(0)
                .totalPoints(questions.stream().mapToInt(QuizQuestion::getPoints).sum())
                .earnedPoints(0)
                .percentage(0.0)
                .submittedAt(session.getCreatedAt())
                .answerResults(answerResults)
                .build();
    }

    public QuizResultSummaryResponse generateQuizResultSummary(Quiz quiz,
                                                               List<QuizQuestion> questions,
                                                               List<QuizAnswerRecord> allResponses) {
        Map<Long, List<QuizAnswerRecord>> responsesByStudent = allResponses.stream()
                .collect(Collectors.groupingBy(QuizAnswerRecord::getStudentId));

        List<QuizResultSummaryResponse.ParticipantResult> participantResults = new ArrayList<>();
        double totalScore = 0;

        for (Map.Entry<Long, List<QuizAnswerRecord>> entry : responsesByStudent.entrySet()) {
            Long studentId = entry.getKey();
            List<QuizAnswerRecord> studentResponses = entry.getValue();

            User student = userRepository.findById(studentId).orElse(null);
            if (student == null) continue;

            int earnedPoints = calculateEarnedPoints(questions, studentResponses);
            int correctAnswers = (int) studentResponses.stream().mapToLong(r -> r.getIsCorrect() ? 1 : 0).sum();

            LocalDateTime submittedAt = studentResponses.stream()
                    .map(QuizAnswerRecord::getAnsweredAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now());

            participantResults.add(QuizResultSummaryResponse.ParticipantResult.builder()
                    .userId(studentId)
                    .studentName(student.getName())
                    .score(earnedPoints)
                    .correctAnswers(correctAnswers)
                    .totalQuestions(questions.size())
                    .percentage(questions.size() > 0 ? (double) correctAnswers / questions.size() * 100 : 0)
                    .submittedAt(submittedAt)
                    .build());

            totalScore += earnedPoints;
        }

        int maxPossibleScore = questions.stream().mapToInt(QuizQuestion::getPoints).sum();
        double averageScore = participantResults.size() > 0 ? totalScore / participantResults.size() : 0;
        double averagePercentage = maxPossibleScore > 0 ? (averageScore / maxPossibleScore) * 100 : 0;

        return QuizResultSummaryResponse.builder()
                .quizId(quiz.getQuizId())
                .quizTitle(quiz.getTitle())
                .totalQuestions(questions.size())
                .maxPossibleScore(maxPossibleScore)
                .totalParticipants(participantResults.size())
                .averageScore(averageScore)
                .averagePercentage(averagePercentage)
                .participants(participantResults)
                .build();
    }

    // === Private Helper Methods ===

    private String getQuizStatus(Quiz quiz) {
        return quiz.isNotStarted() ? "NOT_STARTED" :
                quiz.isActive() ? "ACTIVE" : "ENDED";
    }

    private boolean checkSubmissionStatus(Quiz quiz, User requestUser) {
        if (requestUser == null || requestUser.getUserType() != User.UserType.LEARNER) {
            return false;
        }

        return responseRepository.existsByQuizIdAndStudentId(quiz.getQuizId(), requestUser.getUserId()) ||
                quizSessionRepository.existsByQuizIdAndStudentId(quiz.getQuizId(), requestUser.getUserId());
    }

    private List<QuestionResponse> buildQuestionResponses(List<QuizQuestion> questions, User requestUser, Quiz quiz) {
        if (requestUser.getUserType() == User.UserType.EDUCATOR) {
            return questions.stream()
                    .map(this::convertToQuestionResponse)
                    .collect(Collectors.toList());
        } else if (quiz.isActive()) {
            return questions.stream()
                    .map(this::convertToQuestionResponseWithoutAnswer)
                    .collect(Collectors.toList());
        }
        return null;
    }

    private QuestionResponse convertToQuestionResponse(QuizQuestion q) {
        return QuestionResponse.builder()
                .questionId(q.getQuestionId())
                .quizId(q.getQuizId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .options(q.getOptions())
                .correctAnswer(q.getCorrectAnswer())
                .points(q.getPoints())
                .orderIndex(q.getOrderIndex())
                .build();
    }

    private QuestionResponse convertToQuestionResponseWithoutAnswer(QuizQuestion q) {
        return QuestionResponse.builder()
                .questionId(q.getQuestionId())
                .quizId(q.getQuizId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .options(q.getOptions())
                .correctAnswer(null)
                .points(q.getPoints())
                .orderIndex(q.getOrderIndex())
                .build();
    }

    private int calculateEarnedPoints(List<QuizQuestion> questions, List<QuizAnswerRecord> responses) {
        return responses.stream()
                .mapToInt(response -> {
                    if (response.getIsCorrect()) {
                        return questions.stream()
                                .filter(q -> q.getQuestionId().equals(response.getQuestionId()))
                                .findFirst()
                                .map(QuizQuestion::getPoints)
                                .orElse(0);
                    }
                    return 0;
                })
                .sum();
    }

    private List<QuizResultResponse.AnswerResultResponse> buildAnswerResults(
            List<QuizQuestion> questions, List<QuizAnswerRecord> responses) {
        return responses.stream()
                .map(response -> {
                    QuizQuestion question = questions.stream()
                            .filter(q -> q.getQuestionId().equals(response.getQuestionId()))
                            .findFirst()
                            .orElse(null);

                    return QuizResultResponse.AnswerResultResponse.builder()
                            .questionId(response.getQuestionId())
                            .questionText(question != null ? question.getQuestionText() : "Unknown")
                            .studentAnswer(response.getAnswer())
                            .correctAnswer(question != null ? question.getCorrectAnswer() : "Unknown")
                            .isCorrect(response.getIsCorrect())
                            .points(question != null ? question.getPoints() : 0)
                            .answeredAt(response.getAnsweredAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}