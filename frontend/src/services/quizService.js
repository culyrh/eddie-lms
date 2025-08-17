const quizService = {
  baseURL: 'http://localhost:8080/api',

  // 인증 헤더 생성
  getAuthHeaders: (token) => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  }),

  // ============================================================================
  // 퀴즈 CRUD
  // ============================================================================

  // 클래스룸의 퀴즈 목록 조회
  getQuizzes: async (classroomId, userId, token) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes?userId=${userId}`,
      {
        method: 'GET',
        headers: quizService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 목록 조회 실패');
    }
    return response.json();
  },

  // 퀴즈 상세 조회
  getQuiz: async (classroomId, quizId, userId, token) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes/${quizId}?userId=${userId}`,
      {
        method: 'GET',
        headers: quizService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 조회 실패');
    }
    return response.json();
  },

  // 퀴즈 생성
  createQuiz: async (classroomId, quizData, token, creatorId) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes?creatorId=${creatorId}`,
      {
        method: 'POST',
        headers: quizService.getAuthHeaders(token),
        body: JSON.stringify(quizData),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 생성 실패');
    }
    return response.json();
  },

  // 퀴즈 수정
  updateQuiz: async (classroomId, quizId, quizData, token, creatorId) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes/${quizId}?creatorId=${creatorId}`,
      {
        method: 'PUT',
        headers: quizService.getAuthHeaders(token),
        body: JSON.stringify(quizData),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 수정 실패');
    }
    return response.json();
  },

  // 퀴즈 삭제
  deleteQuiz: async (classroomId, quizId, token, creatorId) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes/${quizId}?creatorId=${creatorId}`,
      {
        method: 'DELETE',
        headers: quizService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 삭제 실패');
    }
    return response.ok;
  },

  // ============================================================================
  // 퀴즈 응시 관련
  // ============================================================================

  // 퀴즈 시작
  startQuiz: async (classroomId, quizId, userId, token) => {
    return quizService.getQuiz(classroomId, quizId, userId, token);
  },

  // 퀴즈 답안 제출
  submitQuiz: async (classroomId, quizId, answers, token, studentId) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes/${quizId}/submit?studentId=${studentId}`,
      {
        method: 'POST',
        headers: quizService.getAuthHeaders(token),
        body: JSON.stringify({ answers }),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 제출 실패');
    }
    return response.json();
  },

  // 퀴즈 결과 조회 (개별 학생)
  getQuizResult: async (classroomId, quizId, userId, token) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes/${quizId}/my-result?studentId=${userId}`,
      {
        method: 'GET',
        headers: quizService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 결과 조회 실패');
    }
    return response.json();
  },

  // 퀴즈 전체 결과 조회 (교육자용)
  getQuizResults: async (classroomId, quizId, token, requestUserId) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes/${quizId}/results?requestUserId=${requestUserId}`,
      {
        method: 'GET',
        headers: quizService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 전체 결과 조회 실패');
    }
    return response.json();
  },

  // 퀴즈 상태 조회 (제출 여부 확인용)
  getQuizStatus: async (classroomId, quizId, userId, token) => {
    const response = await fetch(
      `${quizService.baseURL}/classrooms/${classroomId}/quizzes/${quizId}/status?userId=${userId}`,
      {
        method: 'GET',
        headers: quizService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 상태 조회 실패');
    }
    return response.json();
  },

  // ============================================================================
  // 유틸리티 함수들
  // ============================================================================

  // 퀴즈 상태 계산
  getQuizStatus: (quiz) => {
    const now = new Date();
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(quiz.endTime);

    if (now < startTime) return 'SCHEDULED';
    if (now >= startTime && now <= endTime) return 'ACTIVE';
    return 'ENDED';
  },

  // 남은 시간 계산 (분 단위)
  getRemainingTime: (quiz) => {
    const now = new Date();
    const endTime = new Date(quiz.endTime);
    const diffMs = endTime - now;
    
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60)); // 분 단위로 반환
  },

  // 퀴즈 문제 형식 검증
  validateQuestion: (question) => {
    if (!question.questionText?.trim()) {
      return '문제 내용을 입력해주세요.';
    }
    
    if (!question.correctAnswer?.trim()) {
      return '정답을 입력해주세요.';
    }
    
    if (question.questionType === 'MULTIPLE_CHOICE') {
      if (!question.options || question.options.length < 2) {
        return '객관식 문제는 최소 2개의 선택지가 필요합니다.';
      }
    }
    
    if (question.points <= 0) {
      return '점수는 0보다 커야 합니다.';
    }
    
    return null; // 검증 통과
  },

  // 퀴즈 데이터 검증
  validateQuiz: (quiz) => {
    if (!quiz.title?.trim()) {
      return '퀴즈 제목을 입력해주세요.';
    }
    
    if (!quiz.startTime || !quiz.endTime) {
      return '시작 시간과 종료 시간을 설정해주세요.';
    }
    
    if (new Date(quiz.startTime) >= new Date(quiz.endTime)) {
      return '종료 시간은 시작 시간보다 늦어야 합니다.';
    }
    
    if (!quiz.questions || quiz.questions.length === 0) {
      return '최소 1개의 문제가 필요합니다.';
    }
    
    // 각 문제 검증
    for (let i = 0; i < quiz.questions.length; i++) {
      const questionError = quizService.validateQuestion(quiz.questions[i]);
      if (questionError) {
        return `문제 ${i + 1}: ${questionError}`;
      }
    }
    
    return null; // 검증 통과
  }
};

export default quizService;