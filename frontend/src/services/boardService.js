const boardService = {
  baseURL: 'http://localhost:8080/api',

  // JWT 토큰을 포함한 헤더 생성
  getAuthHeaders: (token) => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  }),

  // 게시글 목록 조회
  getPosts: async (classroomId, search = '', token) => {
    const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/board/posts${searchParam}`,
      {
        headers: boardService.getAuthHeaders(token)
      }
    );
    
    if (!response.ok) {
      throw new Error('게시글 목록 조회 실패');
    }
    return response.json();
  },

  // 게시글 상세 조회
  getPost: async (classroomId, postId, token) => {
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/board/posts/${postId}`,
      {
        headers: boardService.getAuthHeaders(token)
      }
    );
    
    if (!response.ok) {
      throw new Error('게시글 상세 조회 실패');
    }
    return response.json();
  },

  // 게시글 생성
  createPost: async (classroomId, authorId, data, token) => {
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/board/posts?authorId=${authorId}`,
      {
        method: 'POST',
        headers: boardService.getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    
    if (!response.ok) {
      throw new Error('게시글 생성 실패');
    }
    return response.json();
  },

  // 게시글 수정
  updatePost: async (classroomId, postId, authorId, data, token) => {
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/board/posts/${postId}?authorId=${authorId}`,
      {
        method: 'PUT',
        headers: boardService.getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    
    if (!response.ok) {
      throw new Error('게시글 수정 실패');
    }
    return response.json();
  },

  // 게시글 삭제
  deletePost: async (classroomId, postId, authorId, token) => {
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/board/posts/${postId}?authorId=${authorId}`,
      {
        method: 'DELETE',
        headers: boardService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('게시글 삭제 실패');
    }
    return response.ok;
  },

  // 댓글 생성
  createComment: async (classroomId, postId, authorId, content, token) => {
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/board/posts/${postId}/comments?authorId=${authorId}`,
      {
        method: 'POST',
        headers: boardService.getAuthHeaders(token),
        body: JSON.stringify({ content }),
      }
    );
    
    if (!response.ok) {
      throw new Error('댓글 생성 실패');
    }
    return response.json();
  },

  // 댓글 삭제
  deleteComment: async (classroomId, postId, commentId, authorId, token) => {
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/board/posts/${postId}/comments/${commentId}?authorId=${authorId}`,
      {
        method: 'DELETE',
        headers: boardService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('댓글 삭제 실패');
    }
    return response.ok;
  },

  // 파일 업로드 (추후 구현)
  uploadFile: async (classroomId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/files/upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
          // Content-Type은 FormData 사용 시 자동 설정
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('파일 업로드 실패');
    }
    return response.json();
  },

  // 파일 다운로드 (추후 구현)
  downloadFile: async (classroomId, fileId, token) => {
    const response = await fetch(
      `${boardService.baseURL}/classrooms/${classroomId}/files/${fileId}/download`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      }
    );

    if (!response.ok) {
      throw new Error('파일 다운로드 실패');
    }

    // Blob으로 반환하여 다운로드 처리
    return response.blob();
  }
};

export default boardService;