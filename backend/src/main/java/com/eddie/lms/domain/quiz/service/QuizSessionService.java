package com.eddie.lms.domain.quiz.service;

import com.eddie.lms.domain.quiz.entity.Quiz;
import com.eddie.lms.domain.quiz.entity.QuizSession;
import com.eddie.lms.domain.quiz.repository.QuizRepository;
import com.eddie.lms.domain.quiz.repository.QuizSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizSessionService {

    private final QuizSessionRepository quizSessionRepository;
    private final QuizRepository quizRepository;

    /**
     * 퀴즈 세션 시작
     */
    @Transactional
    public QuizSession startSession(Long quizId, Long studentId) {
        // 이미 세션이 있는지 확인
        Optional<QuizSession> existingSession = quizSessionRepository.findByQuizIdAndStudentId(quizId, studentId);
        if (existingSession.isPresent()) {
            QuizSession session = existingSession.get();
            if (session.isActive()) {
                throw new IllegalStateException("이미 진행중인 퀴즈 세션이 있습니다.");
            }
            if (session.getSessionStatus() == QuizSession.SessionStatus.COMPLETED ||
                    session.getSessionStatus() == QuizSession.SessionStatus.TERMINATED) {
                throw new IllegalStateException("이미 완료되거나 종료된 퀴즈입니다. 재응시할 수 없습니다.");
            }
        }

        // 새 세션 생성
        String sessionToken = generateSessionToken();
        QuizSession session = QuizSession.builder()
                .quizId(quizId)
                .studentId(studentId)
                .sessionToken(sessionToken)
                .sessionStatus(QuizSession.SessionStatus.STARTED)
                .startTime(LocalDateTime.now())
                .build();

        QuizSession savedSession = quizSessionRepository.save(session);
        log.info("Quiz session started: {} for student: {}", sessionToken, studentId);
        return savedSession;
    }

    /**
     * 세션 진행 상태로 변경
     */
    @Transactional
    public void markInProgress(String sessionToken) {
        QuizSession session = getActiveSession(sessionToken);
        session.setSessionStatus(QuizSession.SessionStatus.IN_PROGRESS);
        quizSessionRepository.save(session);
    }

    /**
     * 세션 완료
     */
    @Transactional
    public void completeSession(String sessionToken) {
        QuizSession session = getActiveSession(sessionToken);
        session.complete();
        quizSessionRepository.save(session);
        log.info("Quiz session completed: {}", sessionToken);
    }

    /**
     * 세션 강제 종료
     */
    @Transactional
    public void terminateSession(String sessionToken, String reason) {
        QuizSession session = getActiveSession(sessionToken);
        session.terminate(reason);
        quizSessionRepository.save(session);
        log.warn("Quiz session terminated: {} - Reason: {}", sessionToken, reason);
    }

    /**
     * 세션 유효성 확인
     */
    public boolean isSessionValid(String sessionToken) {
        Optional<QuizSession> sessionOpt = quizSessionRepository.findBySessionToken(sessionToken);
        if (sessionOpt.isEmpty()) {
            return false;
        }

        QuizSession session = sessionOpt.get();
        return session.isActive();
    }

    /**
     * 세션 정보 조회
     */
    public QuizSession getSessionInfo(String sessionToken) {
        return getActiveSession(sessionToken);
    }

    /**
     * 퀴즈 재응시 가능 여부 확인
     */
    public boolean canRetake(Long quizId, Long studentId) {
        Optional<QuizSession> session = quizSessionRepository.findByQuizIdAndStudentId(quizId, studentId);
        return session.isEmpty(); // 세션이 없으면 응시 가능
    }

    /**
     * 만료된 세션 정리 (스케줄링)
     */
    @Scheduled(fixedRate = 60000) // 1분마다 실행
    @Transactional
    public void cleanupExpiredSessions() {
        LocalDateTime expiredTime = LocalDateTime.now().minusHours(3); // 3시간 초과 세션 만료
        List<QuizSession> expiredSessions = quizSessionRepository.findExpiredSessions(expiredTime);

        if (!expiredSessions.isEmpty()) {
            List<Long> sessionIds = expiredSessions.stream()
                    .map(QuizSession::getSessionId)
                    .toList();

            quizSessionRepository.expireSessions(sessionIds, LocalDateTime.now());
            log.info("Expired {} quiz sessions", sessionIds.size());
        }
    }

    // === Private Methods ===

    private QuizSession getActiveSession(String sessionToken) {
        Optional<QuizSession> sessionOpt = quizSessionRepository.findBySessionToken(sessionToken);
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("세션을 찾을 수 없습니다: " + sessionToken);
        }

        QuizSession session = sessionOpt.get();
        if (!session.isActive()) {
            throw new IllegalStateException("비활성 세션입니다: " + sessionToken);
        }

        return session;
    }

    private String generateSessionToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}