package com.eddie.lms.domain.classroom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 클래스룸 멤버 엔티티 (학습자들이 클래스룸에 참여한 정보)
 */
@Entity
@Table(name = "classroom_member",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"classroom_id", "user_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MemberStatus status = MemberStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    /**
     * 멤버 상태 열거형
     */
    public enum MemberStatus {
        ACTIVE,    // 활성 멤버
        INACTIVE   // 비활성 멤버
    }

}
