package com.eddie.lms.domain.classroom.repository;

import com.eddie.lms.domain.classroom.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByEducatorIdAndIsActiveTrue(Long educatorId);
    Optional<Classroom> findByClassroomCode(String classroomCode);
    List<Classroom> findByIsActiveTrue();
}