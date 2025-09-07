package com.eddie.lms.controller;

import com.eddie.lms.domain.lesson.entity.LearningMaterial;
import com.eddie.lms.domain.lesson.entity.Lesson;
import com.eddie.lms.domain.lesson.repository.LearningMaterialRepository;
import com.eddie.lms.domain.lesson.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/classrooms/{classroomId}/lessons/{lessonId}/materials")
@RequiredArgsConstructor
@Slf4j
public class LearningMaterialController {

    private final LearningMaterialRepository learningMaterialRepository;
    private final LessonRepository lessonRepository;

    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * 학습자료 목록 조회
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getLearningMaterials(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId) {

        try {
            log.info("Getting learning materials for lesson: {}", lessonId);

            // 수업 존재 여부 확인
            Lesson lesson = lessonRepository.findByLessonIdAndClassroomId(lessonId, classroomId)
                    .orElseThrow(() -> new IllegalArgumentException("수업을 찾을 수 없습니다."));

            // 학습자료 목록 조회
            List<LearningMaterial> materials = learningMaterialRepository
                    .findByLessonLessonIdOrderByUploadedAtDesc(lessonId);

            // DTO로 변환
            List<Map<String, Object>> materialList = materials.stream()
                    .map(this::convertToMap)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", materialList);
            response.put("count", materialList.size());

            log.info("Found {} learning materials for lesson: {}", materialList.size(), lessonId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to get learning materials for lesson: {}", lessonId, e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", "학습자료 목록을 불러오는데 실패했습니다.")
            );
        }
    }

    /**
     * 학습자료 추가 (메타데이터 저장)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> addLearningMaterial(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId,
            @RequestBody Map<String, Object> request) {

        try {
            log.info("Adding learning material to lesson: {}", lessonId);

            // 수업 존재 여부 확인
            Lesson lesson = lessonRepository.findByLessonIdAndClassroomId(lessonId, classroomId)
                    .orElseThrow(() -> new IllegalArgumentException("수업을 찾을 수 없습니다."));

            // 요청 데이터 검증
            validateMaterialRequest(request);

            // 학습자료 엔티티 생성
            LearningMaterial material = LearningMaterial.builder()
                    .lesson(lesson)
                    .title((String) request.get("title"))
                    .fileName((String) request.get("fileName"))
                    .filePath((String) request.get("fileUrl")) // S3 URL을 filePath로 저장
                    .fileType((String) request.get("fileType"))
                    .fileSize(getLongValue(request.get("fileSize")))
                    .uploadedAt(LocalDateTime.now())
                    .build();

            // 데이터베이스에 저장
            LearningMaterial savedMaterial = learningMaterialRepository.save(material);

            log.info("Learning material saved successfully: ID={}, fileName={}",
                    savedMaterial.getMaterialId(), savedMaterial.getFileName());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", convertToMap(savedMaterial));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid material data: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to add learning material to lesson: {}", lessonId, e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", "학습자료 저장에 실패했습니다.")
            );
        }
    }

    /**
     * 학습자료 다운로드 (S3 Pre-signed URL 생성)
     */
    @GetMapping("/{materialId}/download")
    public ResponseEntity<Map<String, Object>> downloadMaterial(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId,
            @PathVariable Long materialId) {

        try {
            log.info("Generating download URL for material: {}", materialId);

            // 학습자료 조회 및 권한 확인
            LearningMaterial material = findMaterialWithValidation(materialId, lessonId, classroomId);

            // S3 Pre-signed URL 생성
            String downloadUrl = generatePresignedUrl(material.getFilePath(), "attachment");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("downloadUrl", downloadUrl);
            response.put("fileName", material.getFileName());
            response.put("fileSize", material.getFileSize());

            log.info("Download URL generated successfully for material: {}", materialId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid download request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to generate download URL for material: {}", materialId, e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", "다운로드 링크 생성에 실패했습니다.")
            );
        }
    }

    /**
     * 학습자료 보기 (S3 Pre-signed URL 생성)
     */
    @GetMapping("/{materialId}/view")
    public ResponseEntity<Map<String, Object>> viewMaterial(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId,
            @PathVariable Long materialId) {

        try {
            log.info("Generating view URL for material: {}", materialId);

            // 학습자료 조회 및 권한 확인
            LearningMaterial material = findMaterialWithValidation(materialId, lessonId, classroomId);

            // S3 Pre-signed URL 생성 (인라인 표시용)
            String viewUrl = generatePresignedUrl(material.getFilePath(), "inline");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("viewUrl", viewUrl);
            response.put("fileName", material.getFileName());
            response.put("fileType", material.getFileType());

            log.info("View URL generated successfully for material: {}", materialId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid view request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to generate view URL for material: {}", materialId, e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", "파일 보기 링크 생성에 실패했습니다.")
            );
        }
    }

    // 영상 스트리밍용 URL 생성 엔드포인트
    @GetMapping("/{materialId}/stream")
    public ResponseEntity<Map<String, Object>> getStreamingUrl(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId,
            @PathVariable Long materialId) {
        try {
            log.info("Generating streaming URL for material: {}", materialId);

            // 학습자료 조회 및 권한 확인
            LearningMaterial material = findMaterialWithValidation(materialId, lessonId, classroomId);

            // 기존 generatePresignedUrl 메서드 사용
            String streamingUrl = generatePresignedUrl(material.getFilePath(), "inline");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("streamingUrl", streamingUrl);
            response.put("fileName", material.getFileName());

            log.info("Streaming URL generated successfully for material: {}", materialId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid streaming request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to generate streaming URL for material: {}", materialId, e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", "스트리밍 URL 생성에 실패했습니다.")
            );
        }
    }

    /**
     * 학습자료 삭제
     */
    @DeleteMapping("/{materialId}")
    public ResponseEntity<Map<String, Object>> deleteMaterial(
            @PathVariable Long classroomId,
            @PathVariable Long lessonId,
            @PathVariable Long materialId) {

        try {
            log.info("Deleting learning material: {}", materialId);

            // 학습자료 조회 및 권한 확인
            LearningMaterial material = findMaterialWithValidation(materialId, lessonId, classroomId);

            // TODO: S3에서 실제 파일 삭제 (선택사항)
            // deleteFileFromS3(material.getFilePath());

            // 데이터베이스에서 삭제
            learningMaterialRepository.delete(material);

            log.info("Learning material deleted successfully: {}", materialId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "학습자료가 삭제되었습니다.");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid delete request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to delete learning material: {}", materialId, e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", "학습자료 삭제에 실패했습니다.")
            );
        }
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    /**
     * 학습자료를 Map으로 변환
     */
    private Map<String, Object> convertToMap(LearningMaterial material) {
        Map<String, Object> map = new HashMap<>();
        map.put("materialId", material.getMaterialId());
        map.put("title", material.getTitle());
        map.put("fileName", material.getFileName());
        map.put("fileType", material.getFileType());
        map.put("filePath", material.getFilePath());
        map.put("fileSize", material.getFileSize());
        map.put("formattedFileSize", material.getFormattedFileSize());
        map.put("uploadedAt", material.getUploadedAt().toString());
        return map;
    }

    /**
     * 학습자료 요청 데이터 검증
     */
    private void validateMaterialRequest(Map<String, Object> request) {
        if (request.get("title") == null || request.get("title").toString().trim().isEmpty()) {
            throw new IllegalArgumentException("자료 제목은 필수입니다.");
        }
        if (request.get("fileName") == null || request.get("fileName").toString().trim().isEmpty()) {
            throw new IllegalArgumentException("파일명은 필수입니다.");
        }
        if (request.get("fileUrl") == null || request.get("fileUrl").toString().trim().isEmpty()) {
            throw new IllegalArgumentException("파일 URL은 필수입니다.");
        }
        if (request.get("fileType") == null || request.get("fileType").toString().trim().isEmpty()) {
            throw new IllegalArgumentException("파일 타입은 필수입니다.");
        }
        if (request.get("fileSize") == null) {
            throw new IllegalArgumentException("파일 크기는 필수입니다.");
        }
    }

    /**
     * Object를 Long으로 안전하게 변환
     */
    private Long getLongValue(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    /**
     * 학습자료 조회 및 권한 검증
     */
    private LearningMaterial findMaterialWithValidation(Long materialId, Long lessonId, Long classroomId) {
        LearningMaterial material = learningMaterialRepository.findById(materialId)
                .orElseThrow(() -> new IllegalArgumentException("학습자료를 찾을 수 없습니다."));

        // 수업 ID 확인
        if (!material.getLesson().getLessonId().equals(lessonId)) {
            throw new IllegalArgumentException("해당 수업의 자료가 아닙니다.");
        }

        // 클래스룸 ID 확인
        if (!material.getLesson().getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("해당 클래스룸의 자료가 아닙니다.");
        }

        return material;
    }

    /**
     * S3 Pre-signed URL 생성
     */
    private String generatePresignedUrl(String filePath, String disposition) {
        try {
            String s3Key = extractS3Key(filePath);
            log.info("=== Pre-signed URL 생성 시작 ===");
            log.info("S3 Key: {}", s3Key);
            log.info("Bucket: {}", bucketName);
            log.info("Region: {}", region);

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(60))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String url = presignedRequest.url().toString();

            log.info("생성된 Pre-signed URL: {}", url);
            log.info("=== Pre-signed URL 생성 완료 ===");

            return url;

        } catch (Exception e) {
            log.error("Pre-signed URL 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("Pre-signed URL 생성 실패: " + e.getMessage());
        }
    }

    /**
     * S3 URL에서 키 추출
     */
    private String extractS3Key(String fileUrl) {
        if (fileUrl.startsWith("https://")) {
            // https://bucket-name.s3.region.amazonaws.com/key 형태에서 key 추출
            int keyStartIndex = fileUrl.indexOf(".com/") + 5;
            if (keyStartIndex > 4) {
                return fileUrl.substring(keyStartIndex);
            }
        }
        // 이미 키 형태인 경우 그대로 반환
        return fileUrl;
    }
}