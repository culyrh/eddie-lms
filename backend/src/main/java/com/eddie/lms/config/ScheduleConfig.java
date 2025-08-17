package com.eddie.lms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 스케줄링 설정
 * QuizSessionService의 @Scheduled 메서드 활성화
 */
@Configuration
@EnableScheduling
public class ScheduleConfig {
}