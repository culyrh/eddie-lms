package com.eddie.lms.domain.board.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCreateRequest {
    private String title;
    private String content;
}
