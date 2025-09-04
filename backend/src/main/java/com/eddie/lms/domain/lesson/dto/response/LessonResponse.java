package com.eddie.lms.domain.lesson.dto.response;

import com.eddie.lms.domain.lesson.entity.Lesson;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 수업 응답 DTO (진도 추적 기능 제거 버전)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResponse {

    private Long lessonId;
    private Long curriculumId;
    private String curriculumTitle;
    private String title;
    private String description;
    private Lesson.LessonType lessonType;
    private String lessonTypeName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 수업 상태 정보 (단순화)
    private String status; // "활성", "대기" 등 간단한 상태만

    // 선택적: 기본 통계만 유지
    private Long totalMaterials;  // 학습자료 개수
    private Long totalAssignments; // 과제 개수
    private Long totalQuizzes;    // 퀴즈 개수
}