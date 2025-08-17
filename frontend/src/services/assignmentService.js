const assignmentService = {
  baseURL: 'http://localhost:8080/api',

  // JWT 토큰을 포함한 헤더 생성
  getAuthHeaders: (token) => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  }),

  // 과제 목록 조회
  getAssignments: async (classroomId, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments`,
      {
        headers: assignmentService.getAuthHeaders(token)
      }
    );
    if (!response.ok) {
      throw new Error('과제 목록 조회 실패');
    }
    return response.json();
  },

  // 과제 상세 조회 (제출물 포함)
  getAssignment: async (classroomId, assignmentId, userId, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}?userId=${userId}`,
      {
        headers: assignmentService.getAuthHeaders(token)
      }
    );
    if (!response.ok) {
      throw new Error('과제 상세 조회 실패');
    }
    return response.json();
  },

  // 과제 생성
  createAssignment: async (classroomId, creatorId, data, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments?creatorId=${creatorId}`,
      {
        method: 'POST',
        headers: assignmentService.getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      throw new Error('과제 생성 실패');
    }
    return response.json();
  },

  // 과제 수정
  updateAssignment: async (classroomId, assignmentId, updaterId, data, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}?updaterId=${updaterId}`,
      {
        method: 'PUT',
        headers: assignmentService.getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      throw new Error('과제 수정 실패');
    }
    return response.json();
  },

  // 과제 삭제
  deleteAssignment: async (classroomId, assignmentId, deleterId, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}?deleterId=${deleterId}`,
      {
        method: 'DELETE',
        headers: assignmentService.getAuthHeaders(token),
      }
    );
    if (!response.ok) {
      throw new Error('과제 삭제 실패');
    }
    return response.ok;
  },

  // 학생의 제출물 조회 (개선)
  getMySubmission: async (classroomId, assignmentId, studentId, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}/my-submission?studentId=${studentId}`,
      {
        headers: assignmentService.getAuthHeaders(token)
      }
    );
    if (!response.ok) {
      if (response.status === 404) {
        return null; // 제출물이 없는 경우
      }
      throw new Error('제출물 조회 실패');
    }
    return response.json();
  },

  // 과제 제출
  submitAssignment: async (classroomId, assignmentId, studentId, data, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}/submissions?studentId=${studentId}`,
      {
        method: 'POST',
        headers: assignmentService.getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      throw new Error('과제 제출 실패');
    }
    return response.json();
  },

  // 과제 재제출
  resubmitAssignment: async (classroomId, assignmentId, studentId, data, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}/submissions?studentId=${studentId}`,
      {
        method: 'PUT',
        headers: assignmentService.getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      throw new Error('과제 재제출 실패');
    }
    return response.json();
  },

  // 과제 채점
  gradeSubmission: async (classroomId, assignmentId, submissionId, graderId, data, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade?graderId=${graderId}`,
      {
        method: 'PUT',
        headers: assignmentService.getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      throw new Error('과제 채점 실패');
    }
    return response.json();
  },

  // 모든 제출물 조회 (교육자용)
  getSubmissions: async (classroomId, assignmentId, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}/submissions`,
      {
        headers: assignmentService.getAuthHeaders(token)
      }
    );
    if (!response.ok) {
      throw new Error('제출물 목록 조회 실패');
    }
    return response.json();
  },

  // 파일 업로드 (과제 제출용)
  uploadSubmissionFile: async (classroomId, assignmentId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}/upload`,
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

  // 파일 다운로드
  downloadSubmissionFile: async (classroomId, assignmentId, fileId, token) => {
    const response = await fetch(
      `${assignmentService.baseURL}/classrooms/${classroomId}/assignments/${assignmentId}/files/${fileId}/download`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      }
    );

    if (!response.ok) {
      throw new Error('파일 다운로드 실패');
    }

    return response.blob();
  }
};

export default assignmentService;