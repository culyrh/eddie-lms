package com.eddie.lms.domain.classroom.repository;

import com.eddie.lms.domain.classroom.entity.ClassroomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClassroomMemberRepository extends JpaRepository<ClassroomMember, Long> {
    List<ClassroomMember> findByUserIdAndStatus(Long userId, ClassroomMember.MemberStatus status);
    List<ClassroomMember> findByClassroomIdAndStatus(Long classroomId, ClassroomMember.MemberStatus status);
    boolean existsByClassroomIdAndUserId(Long classroomId, Long userId);
}