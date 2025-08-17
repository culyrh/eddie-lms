package com.eddie.lms.domain.quiz.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateSubmissionException extends RuntimeException {
    public DuplicateSubmissionException(String message) {
        super(message);
    }

    public DuplicateSubmissionException(String message, Throwable cause) {
        super(message, cause);
    }
}