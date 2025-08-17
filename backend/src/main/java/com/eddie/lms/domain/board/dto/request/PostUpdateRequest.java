package com.eddie.lms.domain.board.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostUpdateRequest {
    private String title;
    private String content;
}
