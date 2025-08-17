package com.eddie.lms.domain.quiz.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class QuizNotStartedException extends RuntimeException {
    public QuizNotStartedException(String message) {
        super(message);
    }

    public QuizNotStartedException(String message, Throwable cause) {
        super(message, cause);
    }
}