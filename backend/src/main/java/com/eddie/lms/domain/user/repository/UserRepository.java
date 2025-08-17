package com.eddie.lms.domain.user.repository;

import com.eddie.lms.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByUserType(User.UserType userType);
    boolean existsByEmail(String email);
}