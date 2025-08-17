package com.eddie.lms.domain.assignment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 과제 제출 엔티티
 */
@Entity
@Table(name = "assignment_submission",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"assignment_id", "student_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long submissionId;

    @Column(name = "assignment_id", nullable = false)
    private Long assignmentId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "submission_text", columnDefinition = "TEXT")
    private String submissionText;

    @Column(name = "file_url")
    private String fileUrl;  // 나중에 파일 업로드 기능 추가 시 사용

    @Column(name = "score")
    private Integer score;  // 채점 점수

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;  // 교육자 피드백

    @Column(name = "submitted_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime submittedAt;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;  // 채점 완료 시간

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 채점 상태 확인
     */
    public boolean isGraded() {
        return score != null && gradedAt != null;
    }

    /**
     * 제출 기한 지연 여부 확인
     */
    public boolean isLate(LocalDateTime dueDate) {
        return submittedAt.isAfter(dueDate);
    }
}