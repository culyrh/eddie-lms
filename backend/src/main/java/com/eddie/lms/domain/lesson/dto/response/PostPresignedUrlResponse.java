package com.eddie.lms.domain.lesson.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostPresignedUrlResponse {
    private String uploadUrl;
    private Map<String, String> formFields;
    private String key;
    private Date expiresAt;
}