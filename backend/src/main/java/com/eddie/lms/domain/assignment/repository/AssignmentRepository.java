package com.eddie.lms.domain.assignment.repository;

import com.eddie.lms.domain.assignment.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
}