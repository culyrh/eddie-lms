package com.eddie.lms.security.oauth;

import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        log.info("OAuth2 User Info: {}", oauth2User.getAttributes());

        // 구글에서 받은 사용자 정보
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String profileImageUrl = oauth2User.getAttribute("picture");

        // 기존 사용자 찾기 또는 새로 생성
        User user = findOrCreateUser(email, name, profileImageUrl);

        // CustomOAuth2User 반환 (사용자 정보 + OAuth2User 정보)
        return new CustomOAuth2User(oauth2User, user);
    }

    private User findOrCreateUser(String email, String name, String profileImageUrl) {
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            // 기존 사용자 정보 업데이트
            User user = existingUser.get();
            user.setName(name);
            user.setProfileImageUrl(profileImageUrl);
            return userRepository.save(user);
        } else {
            // 새 사용자 생성 (기본적으로 LEARNER로 설정)
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .profileImageUrl(profileImageUrl)
                    .userType(User.UserType.LEARNER)
                    .password("OAUTH2_USER") // OAuth2 사용자는 비밀번호 불필요
                    .isActive(true)
                    .build();

            log.info("Creating new OAuth2 user: {}", email);
            return userRepository.save(newUser);
        }
    }
}