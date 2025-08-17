package com.eddie.lms.security.oauth;

import com.eddie.lms.security.jwt.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        CustomOAuth2User oauth2User = (CustomOAuth2User) authentication.getPrincipal();

        // JWT 토큰 생성 (기본 로그인 방식과 동일)
        String accessToken = jwtTokenProvider.createAccessToken(
                oauth2User.getUserId(),
                oauth2User.getEmail(),
                oauth2User.getUserType().name()
        );

        // 사용자 정보를 함께 전달하며 프론트엔드로 리다이렉트
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", accessToken)
                .queryParam("userId", oauth2User.getUserId())
                .queryParam("email", URLEncoder.encode(oauth2User.getEmail(), StandardCharsets.UTF_8))
                .queryParam("name", URLEncoder.encode(oauth2User.getName(), StandardCharsets.UTF_8))
                .queryParam("userType", oauth2User.getUserType())
                .build().toUriString();

        log.info("OAuth2 authentication success. Redirecting to: {}", targetUrl);

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}