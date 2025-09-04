package com.eddie.lms.domain.lesson.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 학습 자료 엔티티 (file_type 길이 확장됨)
 */
@Entity
@Table(name = "learning_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_id")
    private Long materialId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    // file_type 컬럼 길이를 100으로 확장
    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    /**
     * 파일 정보 업데이트
     */
    public void updateFileInfo(String title, String fileName, String filePath,
                               String fileType, Long fileSize) {
        if (title != null && !title.trim().isEmpty()) {
            this.title = title.trim();
        }
        if (fileName != null && !fileName.trim().isEmpty()) {
            this.fileName = fileName.trim();
        }
        if (filePath != null && !filePath.trim().isEmpty()) {
            this.filePath = filePath.trim();
        }
        if (fileType != null && !fileType.trim().isEmpty()) {
            // MIME 타입을 그대로 저장 (길이 제한 해결됨)
            this.fileType = fileType.trim();
        }
        if (fileSize != null && fileSize >= 0) {
            this.fileSize = fileSize;
        }
    }

    /**
     * 파일 크기를 사람이 읽기 쉬운 형태로 변환
     */
    public String getFormattedFileSize() {
        if (fileSize == null || fileSize == 0) {
            return "0 B";
        }

        long size = fileSize;
        String[] units = {"B", "KB", "MB", "GB"};
        int unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return String.format("%.1f %s", (double) size, units[unitIndex]);
    }

    /**
     * 파일 확장자 추출
     */
    public String getFileExtension() {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * 파일 타입 카테고리 반환 (표시용)
     */
    public String getFileTypeCategory() {
        String extension = getFileExtension();

        switch (extension) {
            case "pdf":
                return "PDF";
            case "doc":
            case "docx":
                return "문서";
            case "ppt":
            case "pptx":
                return "프레젠테이션";
            case "mp4":
            case "avi":
            case "mov":
                return "비디오";
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
                return "이미지";
            default:
                return "기타";
        }
    }

    /**
     * 파일이 이미지인지 확인
     */
    public boolean isImage() {
        String extension = getFileExtension();
        return extension.matches("jpg|jpeg|png|gif|bmp|webp");
    }

    /**
     * 파일이 비디오인지 확인
     */
    public boolean isVideo() {
        String extension = getFileExtension();
        return extension.matches("mp4|avi|mov|wmv|flv|webm");
    }

    /**
     * 파일이 문서인지 확인
     */
    public boolean isDocument() {
        String extension = getFileExtension();
        return extension.matches("pdf|doc|docx|ppt|pptx|txt");
    }
}