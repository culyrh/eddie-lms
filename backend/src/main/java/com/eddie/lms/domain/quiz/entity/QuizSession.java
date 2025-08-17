package com.eddie.lms.domain.quiz.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 퀴즈 세션 추적 엔티티 - 1회 응시 제한 및 이탈 방지용
 */
@Entity
@Table(name = "quiz_session",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"quiz_id", "student_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "session_token", unique = true, nullable = false)
    private String sessionToken; // 세션 고유 토큰

    @Enumerated(EnumType.STRING)
    @Column(name = "session_status", nullable = false)
    @Builder.Default
    private SessionStatus sessionStatus = SessionStatus.STARTED;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "tab_switch_count")
    @Builder.Default
    private Integer tabSwitchCount = 0;

    @Column(name = "violation_count")
    @Builder.Default
    private Integer violationCount = 0; // 개발자 도구, 복사붙여넣기 등 위반 횟수

    @Column(name = "warning_count")
    @Builder.Default
    private Integer warningCount = 0; // 경고 횟수

    @Column(name = "is_force_terminated")
    @Builder.Default
    private Boolean isForceTerminated = false; // 강제 종료 여부

    @Column(name = "termination_reason")
    private String terminationReason; // 종료 사유

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 세션 상태
     */
    public enum SessionStatus {
        STARTED,        // 시작됨
        IN_PROGRESS,    // 진행중
        COMPLETED,      // 정상 완료
        TERMINATED,     // 강제 종료
        EXPIRED         // 시간 만료
    }

    /**
     * 세션 완료
     */
    public void complete() {
        this.sessionStatus = SessionStatus.COMPLETED;
        this.endTime = LocalDateTime.now();
    }

    /**
     * 세션 강제 종료
     */
    public void terminate(String reason) {
        this.sessionStatus = SessionStatus.TERMINATED;
        this.endTime = LocalDateTime.now();
        this.isForceTerminated = true;
        this.terminationReason = reason;
    }

    /**
     * 탭 이탈 카운트 증가
     */
    public void incrementTabSwitch() {
        this.tabSwitchCount++;
    }

    /**
     * 위반 카운트 증가
     */
    public void incrementViolation() {
        this.violationCount++;
    }

    /**
     * 경고 카운트 증가
     */
    public void incrementWarning() {
        this.warningCount++;
    }

    /**
     * 세션이 활성 상태인지 확인
     */
    public boolean isActive() {
        return sessionStatus == SessionStatus.STARTED || sessionStatus == SessionStatus.IN_PROGRESS;
    }

    /**
     * 강제 종료 조건 확인
     */
    public boolean shouldTerminate() {
        return tabSwitchCount >= 3 || violationCount >= 5 || warningCount >= 3;
    }
}