const API_BASE_URL = 'http://localhost:8080/api';

const lessonService = {
  
  // HTTP 헤더 생성
  getHeaders: (token) => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  }),

  // ============================================================================
  // 수업 CRUD 메서드들
  // ============================================================================

  // 수업 목록 조회 - 실제 API 호출
  getLessons: async (classroomId, userId, token) => {
    try {
      console.log(`🔍 수업 목록 조회: classroomId=${classroomId}, userId=${userId}`);
      
      const response = await fetch(
        `${API_BASE_URL}/classrooms/${classroomId}/lessons?userId=${userId}`, 
        {
          method: 'GET',
          headers: lessonService.getHeaders(token)
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        } else if (response.status === 403) {
          throw new Error('해당 클래스룸에 접근할 권한이 없습니다.');
        } else if (response.status === 404) {
          throw new Error('클래스룸을 찾을 수 없습니다.');
        }
        throw new Error(`HTTP ${response.status}: 수업 목록을 불러올 수 없습니다.`);
      }
    
      const data = await response.json();
      console.log('✅ 수업 목록 조회 성공:', data);
      return data;
    
    } catch (error) {
      console.error('❌ 수업 목록 조회 실패:', error);
      throw error;
    }
  },

  // 수업 상세 조회 - 누락된 함수 추가
  getLessonDetail: async (classroomId, lessonId, token, userId) => {
    try {
      console.log(`🔍 수업 상세 조회: lessonId=${lessonId}, userId=${userId}`);
      
      const response = await fetch(
        `${API_BASE_URL}/classrooms/${classroomId}/lessons/${lessonId}?userId=${userId}`, 
        {
          method: 'GET',
          headers: lessonService.getHeaders(token)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 수업 정보를 불러올 수 없습니다.`);
      }
      
      const data = await response.json();
      console.log('✅ 수업 상세 조회 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 수업 상세 정보 조회 실패:', error);
      throw error;
    }
  },

  // 수업 생성
  createLesson: async (classroomId, lessonData, token) => {
    try {
      console.log(`🔨 수업 생성 시작:`, lessonData);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/lessons`, {
        method: 'POST',
        headers: lessonService.getHeaders(token),
        body: JSON.stringify(lessonData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '수업을 생성할 수 없습니다.');
      }
      
      const data = await response.json();
      console.log('✅ 수업 생성 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 수업 생성 실패:', error);
      throw error;
    }
  },

  // 수업 수정
  updateLesson: async (classroomId, lessonId, lessonData, token) => {
    try {
      console.log(`🔧 수업 수정 시작: lessonId=${lessonId}`);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: lessonService.getHeaders(token),
        body: JSON.stringify(lessonData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '수업을 수정할 수 없습니다.');
      }
      
      const data = await response.json();
      console.log('✅ 수업 수정 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 수업 수정 실패:', error);
      throw error;
    }
  },

  // 수업 삭제
  deleteLesson: async (classroomId, lessonId, token) => {
    try {
      console.log(`🗑️ 수업 삭제: lessonId=${lessonId}`);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 수업을 삭제할 수 없습니다.`);
      }
      
      console.log('✅ 수업 삭제 성공');
      return { success: true };
      
    } catch (error) {
      console.error('❌ 수업 삭제 실패:', error);
      throw error;
    }
  },

  // 수업 완료 상태 토글
  toggleLessonCompletion: async (classroomId, lessonId, token) => {
    try {
      console.log(`🔄 수업 완료 상태 변경: lessonId=${lessonId}`);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/lessons/${lessonId}/toggle-completion`, {
        method: 'POST',
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 완료 상태를 변경할 수 없습니다.`);
      }
      
      const data = await response.json();
      console.log('✅ 완료 상태 변경 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 완료 상태 변경 실패:', error);
      throw error;
    }
  },

  // 수업 진행률 업데이트
  updateLessonProgress: async (lessonId, progressData, token) => {
    try {
      console.log(`📊 수업 진행률 업데이트: lessonId=${lessonId}`);
      
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: lessonService.getHeaders(token),
        body: JSON.stringify(progressData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 진행률을 업데이트할 수 없습니다.`);
      }
      
      const data = await response.json();
      console.log('✅ 수업 진행률 업데이트 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 수업 진행률 업데이트 실패:', error);
      throw error;
    }
  },

  // ============================================================================
  // 학습 자료 관련 메서드들
  // ============================================================================

  // 학습 자료 목록 조회
  getLearningMaterials: async (classroomId, lessonId, token, userId) => {
    try {
      console.log(`📚 학습 자료 조회: classroomId=${classroomId}, lessonId=${lessonId}, userId=${userId}`);
    
      const url = userId 
        ? `${API_BASE_URL}/classrooms/${classroomId}/lessons/${lessonId}/materials?userId=${userId}`
        : `${API_BASE_URL}/classrooms/${classroomId}/lessons/${lessonId}/materials`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 학습 자료를 불러올 수 없습니다.`);
      }
      
      const data = await response.json();
      console.log('✅ 학습 자료 조회 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 학습 자료 조회 실패:', error);
      // 빈 배열 반환하여 에러 방지
      return [];
    }
  },

  // 학습 자료 삭제
  deleteLearningMaterial: async (materialId, token) => {
    try {
      console.log(`🗑️ 학습 자료 삭제: materialId=${materialId}`);
      
      const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
        method: 'DELETE',
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '자료를 삭제할 수 없습니다.');
      }
      
      console.log('✅ 학습 자료 삭제 성공');
      return { success: true };
      
    } catch (error) {
      console.error('❌ 학습 자료 삭제 실패:', error);
      throw error;
    }
  },

  // ============================================================================
  // 검색 및 필터링
  // ============================================================================

  // 수업 검색
  searchLessons: async (classroomId, keyword, token) => {
    try {
      console.log(`🔍 수업 검색: keyword="${keyword}"`);
      
      const response = await fetch(
        `${API_BASE_URL}/classrooms/${classroomId}/lessons/search?keyword=${encodeURIComponent(keyword)}`,
        {
          method: 'GET',
          headers: lessonService.getHeaders(token)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 수업을 검색할 수 없습니다.`);
      }
      
      const data = await response.json();
      console.log('✅ 수업 검색 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 수업 검색 실패:', error);
      throw error;
    }
  },

  // 수업 유형별 필터링
  getLessonsByType: async (classroomId, lessonType, token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/classrooms/${classroomId}/lessons?type=${lessonType}`,
        {
          method: 'GET',
          headers: lessonService.getHeaders(token)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 수업을 필터링할 수 없습니다.`);
      }
      
      return response.json();
    } catch (error) {
      console.error('수업 유형별 필터링 실패:', error);
      throw error;
    }
  },

  // ============================================================================
  // 유틸리티 함수들
  // ============================================================================

  // 수업 데이터 유효성 검사
  validateLessonData: (lessonData) => {
    const errors = [];

    if (!lessonData.title?.trim()) {
      errors.push('수업 제목을 입력해주세요.');
    } else if (lessonData.title.length > 255) {
      errors.push('수업 제목은 255자 이내로 입력해주세요.');
    }

    if (!lessonData.description?.trim()) {
      errors.push('수업 설명을 입력해주세요.');
    }

    if (!lessonData.lessonType) {
      errors.push('수업 유형을 선택해주세요.');
    } else if (!['VIDEO', 'DOCUMENT'].includes(lessonData.lessonType)) {
      errors.push('올바른 수업 유형을 선택해주세요.');
    }

    return errors;
  },

  // 파일 크기 포맷팅
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 진행률 계산
  calculateProgress: (completedMaterials, totalMaterials) => {
    if (totalMaterials === 0) return 0;
    return Math.round((completedMaterials / totalMaterials) * 100);
  }
};

export default lessonService;