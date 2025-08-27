package com.eddie.lms.domain.lesson.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningMaterialResponse {

    private Long materialId;
    private String title;
    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private String formattedFileSize;
    private LocalDateTime uploadedAt;
    private String downloadUrl; // Presigned URL (나중에 구현)
    private String iconClass;
    private Boolean isDownloadable;
}