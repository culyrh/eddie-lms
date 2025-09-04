package com.eddie.lms.domain.lesson.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompleteMultipartRequest {

    private String key;

    private String uploadId;

    private List<PartInfo> parts;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartInfo {
        private Integer partNumber;
        private String etag;
    }
}