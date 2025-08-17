package com.eddie.lms.domain.quiz.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 퀴즈 제한 시간 초과 예외
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class QuizTimeExceededException extends RuntimeException {
    public QuizTimeExceededException(String message) {
        super(message);
    }

    public QuizTimeExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}