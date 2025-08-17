package com.eddie.lms.domain.classroom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 클래스룸 엔티티
 */
@Entity
@Table(name = "classroom")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "classroom_id")
    private Long classroomId;

    @Column(name = "educator_id", nullable = false)
    private Long educatorId;  // User 엔티티와 연결

    @Column(name = "classroom_name", nullable = false)
    private String classroomName;

    @Column(name = "description")
    private String description;

    @Column(name = "classroom_code", unique = true, nullable = false)
    private String classroomCode;  // 학습자들이 참여할 때 사용하는 코드

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
