package com.eddie.lms.domain.lesson.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 학습 자료 엔티티
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

    @Column(name = "file_type", nullable = false, length = 50)
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
            this.fileType = fileType.trim().toLowerCase();
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
     * 이미지 파일 여부 확인
     */
    public boolean isImageFile() {
        String extension = getFileExtension();
        return extension.matches("(jpg|jpeg|png|gif|bmp|svg|webp)");
    }

    /**
     * 비디오 파일 여부 확인
     */
    public boolean isVideoFile() {
        String extension = getFileExtension();
        return extension.matches("(mp4|avi|mov|wmv|flv|webm|mkv)");
    }

    /**
     * PDF 파일 여부 확인
     */
    public boolean isPdfFile() {
        return "pdf".equals(getFileExtension());
    }

    /**
     * 압축 파일 여부 확인
     */
    public boolean isArchiveFile() {
        String extension = getFileExtension();
        return extension.matches("(zip|rar|7z|tar|gz)");
    }

    /**
     * 문서 파일 여부 확인
     */
    public boolean isDocumentFile() {
        String extension = getFileExtension();
        return extension.matches("(doc|docx|ppt|pptx|xls|xlsx|txt|rtf)");
    }

    /**
     * 다운로드 가능한 파일인지 확인
     */
    public boolean isDownloadable() {
        return filePath != null && !filePath.trim().isEmpty();
    }

    /**
     * 파일 타입에 따른 아이콘 클래스 반환 (프론트엔드에서 사용)
     */
    public String getIconClass() {
        if (isImageFile()) {
            return "fa-image";
        } else if (isVideoFile()) {
            return "fa-video";
        } else if (isPdfFile()) {
            return "fa-file-pdf";
        } else if (isDocumentFile()) {
            return "fa-file-word";
        } else if (isArchiveFile()) {
            return "fa-file-archive";
        } else {
            return "fa-file";
        }
    }
}