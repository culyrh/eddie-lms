package com.eddie.lms.security.oauth;

import com.eddie.lms.domain.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class CustomOAuth2User implements OAuth2User {

    private final OAuth2User oauth2User;
    private final User user;

    public CustomOAuth2User(OAuth2User oauth2User, User user) {
        this.oauth2User = oauth2User;
        this.user = user;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return oauth2User.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 사용자 타입에 따른 권한 부여
        String authority = "ROLE_" + user.getUserType().name();
        return Collections.singletonList(new SimpleGrantedAuthority(authority));
    }

    @Override
    public String getName() {
        return user.getName();
    }

    // 추가 메서드들
    public Long getUserId() {
        return user.getUserId();
    }

    public String getEmail() {
        return user.getEmail();
    }

    public User.UserType getUserType() {
        return user.getUserType();
    }
}