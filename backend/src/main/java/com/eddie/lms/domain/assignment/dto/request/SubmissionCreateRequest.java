package com.eddie.lms.domain.assignment.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionCreateRequest {
    private String submissionText;
    private String fileUrl;  // 나중에 파일 업로드 기능 추가 시 사용
}