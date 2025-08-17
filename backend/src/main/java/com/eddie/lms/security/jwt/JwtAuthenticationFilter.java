package com.eddie.lms.security.jwt;

import com.eddie.lms.domain.user.entity.User;
import com.eddie.lms.domain.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        log.debug("JWT Filter processing: {} {}", method, requestURI);

        // 공개 엔드포인트는 JWT 검증 스킵
        if (isPublicEndpoint(requestURI)) {
            log.debug("Public endpoint, skipping JWT validation: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = resolveToken(request);
        log.debug("JWT token present: {}", jwt != null);

        if (StringUtils.hasText(jwt)) {
            if (jwtTokenProvider.validateToken(jwt)) {
                try {
                    // 토큰에서 사용자 ID 추출
                    Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
                    String userType = jwtTokenProvider.getUserTypeFromToken(jwt);

                    log.debug("JWT validation successful - userId: {}, userType: {}", userId, userType);

                    // 사용자 조회
                    Optional<User> userOptional = userRepository.findById(userId);

                    if (userOptional.isPresent()) {
                        User user = userOptional.get();

                        // 토큰의 userType과 DB의 userType 일치 확인
                        if (!user.getUserType().name().equals(userType)) {
                            log.warn("UserType mismatch - Token: {}, DB: {}", userType, user.getUserType().name());
                        } else {
                            // 권한 설정
                            String authority = "ROLE_" + userType;
                            SimpleGrantedAuthority grantedAuthority = new SimpleGrantedAuthority(authority);

                            // Authentication 객체 생성
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(user, null, Collections.singletonList(grantedAuthority));

                            // SecurityContext에 설정
                            SecurityContextHolder.getContext().setAuthentication(authentication);

                            log.debug("Set Authentication to security context for '{}', authority: '{}', uri: {}",
                                    user.getEmail(), authority, requestURI);
                        }
                    } else {
                        log.warn("User not found for token - userId: {}", userId);
                    }
                } catch (Exception e) {
                    log.error("Cannot set user authentication for URI {}: {}", requestURI, e.getMessage());
                }
            } else {
                log.debug("Invalid JWT token for URI: {}", requestURI);
            }
        } else {
            log.debug("No JWT token found for URI: {}", requestURI);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 공개 엔드포인트 확인
     */
    private boolean isPublicEndpoint(String requestURI) {
        String[] publicPaths = {
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/check-email",
                "/oauth2/",
                "/swagger-ui/",
                "/v3/api-docs/",
                "/actuator/health"
        };

        for (String path : publicPaths) {
            if (requestURI.startsWith(path)) {
                return true;
            }
        }
        return false;
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}