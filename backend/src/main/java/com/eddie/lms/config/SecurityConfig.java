package com.eddie.lms.config;

import com.eddie.lms.security.jwt.JwtAuthenticationFilter;
import com.eddie.lms.security.oauth.CustomOAuth2UserService;
import com.eddie.lms.security.oauth.OAuth2AuthenticationSuccessHandler;
import com.eddie.lms.security.oauth.OAuth2AuthenticationFailureHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security 설정 - OAuth2 + JWT 통합 (API와 웹 분리)
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    /**
     * PasswordEncoder Bean 등록
     * BCrypt 알고리즘을 사용하여 비밀번호 암호화
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS 설정
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // CSRF 비활성화 (JWT 사용으로 인해)
                .csrf(AbstractHttpConfigurer::disable)

                // 세션 정책: STATELESS (JWT 기반)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 요청 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // 공개 엔드포인트
                        .requestMatchers(
                                "/",
                                "/login",
                                "/oauth2/**",
                                "/api/auth/login",   // 일반 로그인
                                "/api/auth/register",  // 회원가입 (추가 검증 로직 포함)
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/actuator/health"   // health check만 공개
                        ).permitAll()

                        // 교육자만 접근 가능한 엔드포인트
                        .requestMatchers(HttpMethod.POST, "/api/classrooms").hasRole("EDUCATOR")  // 클래스룸 생성
                        .requestMatchers(HttpMethod.POST, "/api/classrooms/*/assignments").hasRole("EDUCATOR")  // 과제 생성
                        .requestMatchers(HttpMethod.PUT, "/api/classrooms/*/assignments/*").hasRole("EDUCATOR")  // 과제 수정
                        .requestMatchers(HttpMethod.DELETE, "/api/classrooms/*/assignments/*").hasRole("EDUCATOR")  // 과제 삭제
                        .requestMatchers(HttpMethod.PUT, "/api/classrooms/*/assignments/*/submissions/*/grade").hasRole("EDUCATOR")  // 채점
                        .requestMatchers(HttpMethod.POST, "/api/classrooms/*/quizzes").hasRole("EDUCATOR")  // 퀴즈 생성
                        .requestMatchers(HttpMethod.PUT, "/api/classrooms/*/quizzes/*").hasRole("EDUCATOR")  // 퀴즈 수정
                        .requestMatchers(HttpMethod.DELETE, "/api/classrooms/*/quizzes/*").hasRole("EDUCATOR")  // 퀴즈 삭제

                        // 학습자만 접근 가능한 엔드포인트
                        .requestMatchers(HttpMethod.POST, "/api/classrooms/*/assignments/*/submissions").hasRole("LEARNER")  // 과제 제출 (학습자만)
                        .requestMatchers(HttpMethod.POST, "/api/classrooms/*/quizzes/*/submit").hasRole("LEARNER")  // 퀴즈 제출
                        .requestMatchers(HttpMethod.POST, "/api/quiz-sessions/start").hasRole("LEARNER")
                        .requestMatchers(HttpMethod.POST, "/api/quiz-sessions/*/progress").hasRole("LEARNER")
                        .requestMatchers(HttpMethod.POST, "/api/quiz-sessions/*/tab-switch").hasRole("LEARNER")
                        .requestMatchers(HttpMethod.POST, "/api/quiz-sessions/*/violation").hasRole("LEARNER")
                        .requestMatchers(HttpMethod.POST, "/api/quiz-sessions/*/complete").hasRole("LEARNER")
                        .requestMatchers(HttpMethod.POST, "/api/quiz-sessions/*/terminate").hasRole("LEARNER")
                        .requestMatchers(HttpMethod.GET, "/api/quiz-sessions/*/status").hasRole("LEARNER")
                        .requestMatchers(HttpMethod.GET, "/api/quiz-sessions/can-retake").hasRole("LEARNER")

                        // 인증된 사용자는 모두 접근 가능 (교육자/학습자 공통)
                        .requestMatchers(HttpMethod.GET, "/api/classrooms/**").authenticated()  // 클래스룸 관련 조회
                        .requestMatchers(HttpMethod.POST, "/api/classrooms/join").authenticated()  // 클래스룸 참여
                        .requestMatchers(HttpMethod.GET, "/api/classrooms/*/quizzes/**").authenticated()  // 퀴즈 조회
                        .requestMatchers(HttpMethod.GET, "/api/classrooms/*/lessons").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/classrooms/*/lessons/*/materials/upload/**").hasAnyRole("EDUCATOR", "LEARNER")

                        // 웹 페이지는 허용
                        .anyRequest().permitAll()
                )

                // API 요청에 대해서는 401 응답 (리다이렉트하지 않음)
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                request -> request.getRequestURI().startsWith("/api/")
                        )
                )

                // OAuth2 로그인 설정 (웹 페이지용만)
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .userInfoEndpoint(userInfo ->
                                userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler)
                )

                // JWT 필터 추가
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}