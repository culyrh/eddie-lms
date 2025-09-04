package com.eddie.lms.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedUploadPartRequest;
import software.amazon.awssdk.services.s3.presigner.model.UploadPartPresignRequest;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class MultipartUploadController {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.access-key}")
    private String accessKey;

    @Value("${aws.s3.secret-key}")
    private String secretKey;

    @Value("${aws.s3.region}")
    private String region;

    // 1단계: Multipart Upload 시작
    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiateMultipartUpload(
            @RequestBody Map<String, Object> request) {

        try {
            String fileName = (String) request.get("fileName");
            String fileType = (String) request.get("fileType");

            // S3 키 생성 (learning-materials/ 폴더에 저장)
            String key = "learning-materials/" + UUID.randomUUID() + "_" + fileName;

            // Multipart Upload 시작
            CreateMultipartUploadRequest createRequest = CreateMultipartUploadRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(fileType)
                    .build();

            CreateMultipartUploadResponse response = s3Client.createMultipartUpload(createRequest);

            Map<String, Object> result = new HashMap<>();
            result.put("uploadId", response.uploadId());
            result.put("key", key);

            log.info("Multipart upload initiated: uploadId={}, key={}", response.uploadId(), key);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Failed to initiate multipart upload", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 2단계: Presigned URL 생성 (S3Presigner 사용)
    @PostMapping("/presigned-url")
    public ResponseEntity<Map<String, Object>> getPresignedUrl(
            @RequestBody Map<String, Object> request) {

        try {
            String uploadId = (String) request.get("uploadId");
            String key = (String) request.get("key");
            Integer partNumber = (Integer) request.get("partNumber");

            // S3Presigner 생성
            try (S3Presigner presigner = S3Presigner.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build()) {

                // UploadPart용 Presigned URL 생성
                UploadPartRequest uploadPartRequest = UploadPartRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .uploadId(uploadId)
                        .partNumber(partNumber)
                        .build();

                UploadPartPresignRequest presignRequest = UploadPartPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(15))
                        .uploadPartRequest(uploadPartRequest)
                        .build();

                PresignedUploadPartRequest presignedRequest = presigner.presignUploadPart(presignRequest);

                Map<String, Object> result = new HashMap<>();
                result.put("presignedUrl", presignedRequest.url().toString());
                result.put("partNumber", partNumber);

                log.info("Generated presigned URL for part {}: {}", partNumber, presignedRequest.url());

                return ResponseEntity.ok(result);
            }

        } catch (Exception e) {
            log.error("Failed to generate presigned URL", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 3단계: Multipart Upload 완료
    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completeMultipartUpload(
            @RequestBody Map<String, Object> request) {

        try {
            String uploadId = (String) request.get("uploadId");
            String key = (String) request.get("key");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) request.get("parts");

            // Parts 정보 변환
            List<CompletedPart> completedParts = parts.stream()
                    .map(part -> CompletedPart.builder()
                            .partNumber((Integer) part.get("partNumber"))
                            .eTag((String) part.get("etag"))
                            .build())
                    .toList();

            // Multipart Upload 완료
            CompleteMultipartUploadRequest completeRequest = CompleteMultipartUploadRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .uploadId(uploadId)
                    .multipartUpload(CompletedMultipartUpload.builder()
                            .parts(completedParts)
                            .build())
                    .build();

            CompleteMultipartUploadResponse response = s3Client.completeMultipartUpload(completeRequest);

            // 파일 URL 생성
            String fileUrl = String.format("https://%s.s3.%s.amazonaws.com/%s",
                    bucketName,
                    s3Client.serviceClientConfiguration().region().id(),
                    key);

            Map<String, Object> result = new HashMap<>();
            result.put("fileUrl", fileUrl);
            result.put("key", key);

            log.info("Multipart upload completed: key={}, location={}", key, fileUrl);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Failed to complete multipart upload", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4단계: 업로드 중단 (선택사항)
    @PostMapping("/abort")
    public ResponseEntity<Map<String, Object>> abortMultipartUpload(
            @RequestBody Map<String, Object> request) {

        try {
            String uploadId = (String) request.get("uploadId");
            String key = (String) request.get("key");

            AbortMultipartUploadRequest abortRequest = AbortMultipartUploadRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .uploadId(uploadId)
                    .build();

            s3Client.abortMultipartUpload(abortRequest);

            log.info("Multipart upload aborted: uploadId={}, key={}", uploadId, key);

            return ResponseEntity.ok(Map.of("message", "Upload aborted successfully"));

        } catch (Exception e) {
            log.error("Failed to abort multipart upload", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}