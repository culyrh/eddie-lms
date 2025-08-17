package com.eddie.lms.domain.quiz.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class QuizEndedException extends RuntimeException {
    public QuizEndedException(String message) {
        super(message);
    }

    public QuizEndedException(String message, Throwable cause) {
        super(message, cause);
    }
}