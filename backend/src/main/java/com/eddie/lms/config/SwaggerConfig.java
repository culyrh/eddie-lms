// API 문서화 설정 (OpenAPI 3.0)
// REST API 자동 문서 생성
// 개발/운영 서버 URL 설정
// JWT Bearer 토큰 인증 스키마 정의
// Swagger UI에서 API 테스트 가능

package com.eddie.lms.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger/OpenAPI 설정
 * REST API 문서화를 위한 설정
 */
@Configuration
public class SwaggerConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("개발 서버"),
                        new Server()
                                .url("https://api.eddie-lms.com")
                                .description("운영 서버")
                ))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("Bearer Authentication", createAPIKeyScheme()));
    }

    private Info apiInfo() {
        return new Info()
                .title("EDDIE LMS API")
                .description("""
                        EDDIE LMS의 REST API 문서입니다.
                        
                        ## 주요 기능
                        - 🎓 **실시간 세션 관리**: 라이브 교육 세션 생성/관리
                        - ✏️ **실시간 필기 동기화**: PDF 위 실시간 필기 및 동기화
                        - 🎵 **오디오 타임스탬프 연동**: 페이지별 오디오 동기화
                        - 💬 **실시간 채팅**: WebSocket 기반 실시간 소통
                        
                        ## WebSocket 연동
                        실시간 기능은 REST API와 WebSocket을 함께 사용합니다.
                        - 연결: `ws://localhost:8080/ws/sessions/{sessionId}?token={sessionToken}`
                        - 상세 명세: [WebSocket Events](./docs/websocket-events.yaml)
                        
                        ## 인증
                        모든 API는 JWT Bearer 토큰 인증이 필요합니다.
                        ```
                        Authorization: Bearer {your-jwt-token}
                        ```
                        
                        ## 환경별 접근
                        - **개발**: http://localhost:8080
                        - **운영**: https://api.eddie-lms.com
                        """)
                .version("1.0.0")
                .contact(new Contact()
                        .name("EDDIE Team")
                        .email("dev@eddie-lms.com")
                        .url("https://eddie-lms.com"))
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT"));
    }

    private SecurityScheme createAPIKeyScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer")
                .description("JWT 토큰을 입력하세요. 'Bearer ' 접두사는 자동으로 추가됩니다.");
    }
}