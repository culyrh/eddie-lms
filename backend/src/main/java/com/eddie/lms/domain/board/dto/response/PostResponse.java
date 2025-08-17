package com.eddie.lms.domain.board.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long postId;
    private Long classroomId;
    private Long authorId;
    private String authorName;
    private String title;
    private String content;
    private Integer commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
