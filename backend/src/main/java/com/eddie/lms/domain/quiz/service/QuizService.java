package com.eddie.lms.domain.quiz.service;


import com.eddie.lms.domain.quiz.dto.request.QuizCreateRequest;
import com.eddie.lms.domain.quiz.dto.request.QuizSubmitRequest;
import com.eddie.lms.domain.quiz.dto.request.QuizUpdateRequest;
import com.eddie.lms.domain.quiz.dto.response.*;
import com.eddie.lms.domain.quiz.entity.Quiz;
import com.eddie.lms.domain.quiz.entity.QuizAnswerRecord;
import com.eddie.lms.domain.quiz.entity.QuizQuestion;
import com.eddie.lms.domain.quiz.entity.QuizSession;
import com.eddie.lms.domain.quiz.exception.DuplicateSubmissionException;
import com.eddie.lms.domain.quiz.exception.QuizEndedException;
import com.eddie.lms.domain.quiz.exception.QuizNotStartedException;
import com.eddie.lms.domain.quiz.exception.QuizTimeExceededException;
import com.eddie.lms.domain.quiz.repository.QuizAnswerRecordRepository;
import com.eddie.lms.domain.quiz.repository.QuizQuestionRepository;
import com.eddie.lms.domain.quiz.repository.QuizRepository;
import com.eddie.lms.domain.quiz.repository.QuizSessionRepository;
import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 퀴즈 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizAnswerRecordRepository responseRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final UserRepository userRepository;
    private final QuizResponseService responseService;

    @Transactional
    public QuizResponse createQuiz(Long classroomId, QuizCreateRequest request, Long creatorId) {
        log.info("Creating quiz in classroom: {} by user: {}", classroomId, creatorId);

        User creator = validateEducator(creatorId);
        validateQuizTimes(request.getStartTime(), request.getEndTime());

        Quiz quiz = Quiz.builder()
                .classroomId(classroomId)
                .creatorId(creatorId)
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .build();

        Quiz savedQuiz = quizRepository.save(quiz);

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            createQuizQuestions(savedQuiz.getQuizId(), request.getQuestions());
        }

        return responseService.convertToQuizResponse(savedQuiz, creator, creator);
    }

    public List<QuizResponse> getQuizzes(Long classroomId, Long userId) {
        User user = validateUserExists(userId);

        return quizRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
                .map(quiz -> {
                    User creator = userRepository.findById(quiz.getCreatorId()).orElse(null);
                    return responseService.convertToQuizResponse(quiz, creator, user);
                })
                .collect(Collectors.toList());
    }

    public QuizDetailResponse getQuizDetail(Long classroomId, Long quizId, Long userId) {
        Quiz quiz = validateQuizExists(quizId, classroomId);
        User user = validateUserExists(userId);

        return responseService.convertToQuizDetailResponse(quiz, user);
    }

    @Transactional
    public QuizResponse updateQuiz(Long classroomId, Long quizId, QuizUpdateRequest request, Long creatorId) {
        Quiz quiz = validateQuizExists(quizId, classroomId);
        validateQuizOwnership(quiz, creatorId);
        validateQuizTimes(request.getStartTime(), request.getEndTime());

        // 퀴즈 수정
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setStartTime(request.getStartTime());
        quiz.setEndTime(request.getEndTime());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());

        Quiz updatedQuiz = quizRepository.save(quiz);

        if (request.getQuestions() != null) {
            questionRepository.deleteByQuizId(quizId);
            createQuizQuestions(quizId, request.getQuestions());
        }

        User creator = validateUserExists(creatorId);
        return responseService.convertToQuizResponse(updatedQuiz, creator, creator);
    }

    @Transactional
    public void deleteQuiz(Long classroomId, Long quizId, Long creatorId) {
        Quiz quiz = validateQuizExists(quizId, classroomId);
        validateQuizOwnership(quiz, creatorId);

        responseRepository.deleteAll(responseRepository.findByQuizId(quizId));
        questionRepository.deleteByQuizId(quizId);
        quizRepository.delete(quiz);
    }

    @Transactional
    public QuizResultResponse submitQuiz(Long classroomId, Long quizId, QuizSubmitRequest request, Long studentId) {
        Quiz quiz = validateQuizExists(quizId, classroomId);
        User student = validateLearner(studentId);

        validateNotAlreadySubmitted(quizId, studentId);
        validateQuizSubmissionTiming(quiz, studentId);

        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndex(quizId);
        List<QuizAnswerRecord> responses = processAnswers(quiz, student, questions, request.getAnswers());

        responseRepository.saveAll(responses);
        return responseService.generateQuizResult(quiz, student, questions, responses);
    }

    public QuizResultResponse getMyQuizResult(Long classroomId, Long quizId, Long studentId) {
        Quiz quiz = validateQuizExists(quizId, classroomId);
        User student = validateUserExists(studentId);

        // 정상 완료 확인
        List<QuizAnswerRecord> responses = responseRepository.findByQuizIdAndStudentId(quizId, studentId);
        if (!responses.isEmpty()) {
            List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndex(quizId);
            return responseService.generateQuizResult(quiz, student, questions, responses);
        }

        // 이탈 확인
        Optional<QuizSession> session = quizSessionRepository.findByQuizIdAndStudentId(quizId, studentId);
        if (session.isPresent()) {
            List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndex(quizId);
            return responseService.generateDropoutResult(quiz, student, questions, session.get());
        }

        return null;
    }

    public QuizResultSummaryResponse getQuizResultsSummary(Long classroomId, Long quizId, Long requestUserId) {
        validateEducator(requestUserId);
        Quiz quiz = validateQuizExists(quizId, classroomId);
        validateQuizOwnership(quiz, requestUserId);

        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndex(quizId);
        List<QuizAnswerRecord> allResponses = responseRepository.findByQuizId(quizId);

        return responseService.generateQuizResultSummary(quiz, questions, allResponses);
    }

    public QuizStatusResponse getQuizStatus(Long classroomId, Long quizId, Long userId) {
        Quiz quiz = validateQuizExists(quizId, classroomId);
        User user = validateUserExists(userId);

        boolean hasSubmitted = false;
        if (user.getUserType() == User.UserType.LEARNER) {
            hasSubmitted = responseRepository.existsByQuizIdAndStudentId(quizId, userId) ||
                    quizSessionRepository.existsByQuizIdAndStudentId(quizId, userId);
        }

        String status = quiz.isNotStarted() ? "NOT_STARTED" :
                quiz.isActive() ? "ACTIVE" : "ENDED";

        return QuizStatusResponse.builder()
                .quizId(quizId)
                .status(status)
                .hasSubmitted(hasSubmitted)
                .canTake(quiz.isActive() && !hasSubmitted && user.getUserType() == User.UserType.LEARNER)
                .build();
    }

    // === Private Helper Methods ===

    private void createQuizQuestions(Long quizId, List<QuizCreateRequest.QuestionCreateRequest> questionRequests) {
        List<QuizQuestion> questions = questionRequests.stream()
                .map(q -> QuizQuestion.builder()
                        .quizId(quizId)
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .options(q.getQuestionType() == QuizQuestion.QuestionType.MULTIPLE_CHOICE ? q.getOptions() : null)
                        .correctAnswer(q.getCorrectAnswer())
                        .points(q.getPoints())
                        .orderIndex(q.getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        questionRepository.saveAll(questions);
    }

    private List<QuizAnswerRecord> processAnswers(Quiz quiz, User student,
                                                  List<QuizQuestion> questions,
                                                  List<QuizSubmitRequest.AnswerRequest> answerRequests) {

        return answerRequests.stream()
                .map(answer -> {
                    QuizQuestion question = questions.stream()
                            .filter(q -> q.getQuestionId().equals(answer.getQuestionId()))
                            .findFirst()
                            .orElse(null);

                    if (question == null) return null;

                    boolean isCorrect = checkAnswer(question, answer.getAnswer());

                    return QuizAnswerRecord.builder()
                            .quizId(quiz.getQuizId())
                            .studentId(student.getUserId())
                            .questionId(answer.getQuestionId())
                            .answer(answer.getAnswer())
                            .isCorrect(isCorrect)
                            .build();
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }

    private boolean checkAnswer(QuizQuestion question, String studentAnswer) {
        if (question.getQuestionType() == QuizQuestion.QuestionType.MULTIPLE_CHOICE) {
            return question.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
        } else {
            String correct = question.getCorrectAnswer().toLowerCase().trim();
            String student = studentAnswer.toLowerCase().trim();
            return correct.equals(student) || student.contains(correct) || correct.contains(student);
        }
    }

    // === 검증 메서드들 ===

    private User validateUserExists(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));
    }

    private User validateEducator(Long userId) {
        User user = validateUserExists(userId);
        if (user.getUserType() != User.UserType.EDUCATOR) {
            throw new AccessDeniedException("교육자만 이 작업을 수행할 수 있습니다.");
        }
        return user;
    }

    private User validateLearner(Long userId) {
        User user = validateUserExists(userId);
        if (user.getUserType() != User.UserType.LEARNER) {
            throw new AccessDeniedException("학습자만 이 작업을 수행할 수 있습니다.");
        }
        return user;
    }

    private Quiz validateQuizExists(Long quizId, Long classroomId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("퀴즈를 찾을 수 없습니다: " + quizId));

        if (!quiz.getClassroomId().equals(classroomId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "퀴즈가 해당 클래스룸에 속하지 않습니다.");
        }
        return quiz;
    }

    private void validateQuizOwnership(Quiz quiz, Long userId) {
        if (!quiz.getCreatorId().equals(userId)) {
            throw new AccessDeniedException("퀴즈 작성자만 이 작업을 수행할 수 있습니다.");
        }
    }

    private void validateNotAlreadySubmitted(Long quizId, Long studentId) {
        if (responseRepository.existsByQuizIdAndStudentId(quizId, studentId)) {
            throw new DuplicateSubmissionException("이미 이 퀴즈에 답안을 제출하셨습니다.");
        }
    }

    private void validateQuizTimes(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시작 시간과 종료 시간을 모두 설정해야 합니다.");
        }

        if (startTime.isAfter(endTime) || startTime.isEqual(endTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시작 시간은 종료 시간보다 이전이어야 합니다.");
        }
    }

    private void validateQuizSubmissionTiming(Quiz quiz, Long studentId) {
        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(quiz.getStartTime())) {
            throw new QuizNotStartedException("퀴즈가 아직 시작되지 않았습니다.");
        }

        if (now.isAfter(quiz.getEndTime())) {
            throw new QuizEndedException("퀴즈가 이미 종료되었습니다.");
        }

        // 제한 시간 검증
        if (quiz.getTimeLimitMinutes() != null && quiz.getTimeLimitMinutes() > 0) {
            List<QuizAnswerRecord> existingResponses = responseRepository.findByQuizIdAndStudentId(quiz.getQuizId(), studentId);

            LocalDateTime quizStartedAt;
            if (!existingResponses.isEmpty()) {
                quizStartedAt = existingResponses.stream()
                        .map(QuizAnswerRecord::getAnsweredAt)
                        .min(LocalDateTime::compareTo)
                        .orElse(quiz.getStartTime());
            } else {
                quizStartedAt = quiz.getStartTime().isAfter(now.minusMinutes(quiz.getTimeLimitMinutes()))
                        ? quiz.getStartTime()
                        : now.minusMinutes(quiz.getTimeLimitMinutes());
            }

            long elapsedMinutes = ChronoUnit.MINUTES.between(quizStartedAt, now);
            if (elapsedMinutes > quiz.getTimeLimitMinutes()) {
                throw new QuizTimeExceededException(
                        String.format("제한 시간 %d분을 초과했습니다.", quiz.getTimeLimitMinutes())
                );
            }
        }
    }
}