package com.eddie.lms.domain.board.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {
    private Long commentId;
    private Long postId;
    private Long authorId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
