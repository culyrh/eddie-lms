// Spring boot 애플리케이션의 진입점
// @SpringBootApplication 어노테이션으로 Spring Boot 자동 설정 활성화
// 서버 시작 시 실행되는 메인 메서드

package com.eddie.lms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EddieLmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(EddieLmsApplication.class, args);
	}

}
