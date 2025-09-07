package com.eddie.lms.domain.progress.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningProgressResponse {

    private Double completionPercentage;
    private Double lastAccessedTime;
    private Boolean isCompleted;
    private LocalDateTime lastAccessed;
    private LocalDateTime completedAt;

    /**
     * 진도율을 정수로 반환
     */
    public int getCompletionPercentageAsInt() {
        return completionPercentage != null ? (int) Math.round(completionPercentage) : 0;
    }

    /**
     * 완료 여부를 문자열로 반환
     */
    public String getCompletionStatus() {
        if (Boolean.TRUE.equals(isCompleted)) {
            return "완료";
        } else if (completionPercentage != null && completionPercentage > 0) {
            return "진행중";
        } else {
            return "시작안함";
        }
    }
}