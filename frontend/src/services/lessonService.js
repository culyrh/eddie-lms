const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const lessonService = {
  // 공통 헤더 생성 함수
  getHeaders: (token) => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  }),

  // 클래스룸의 수업 목록 조회
  getLessonsByClassroom: async (classroomId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/lessons`, {
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '수업 목록을 불러올 수 없습니다.');
      }
      
      return response.json();
    } catch (error) {
      console.error('수업 목록 조회 실패:', error);
      throw error;
    }
  },

  // 커리큘럼 목록 조회
  getCurriculumsByClassroom: async (classroomId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/curriculums`, {
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '커리큘럼을 불러올 수 없습니다.');
      }
      
      return response.json();
    } catch (error) {
      console.error('커리큘럼 조회 실패:', error);
      throw error;
    }
  },

  // 새 수업 생성
  createLesson: async (lessonData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        headers: lessonService.getHeaders(token),
        body: JSON.stringify(lessonData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '수업을 생성할 수 없습니다.');
      }
      
      return response.json();
    } catch (error) {
      console.error('수업 생성 실패:', error);
      throw error;
    }
  },

  // 수업 수정
  updateLesson: async (lessonId, lessonData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: lessonService.getHeaders(token),
        body: JSON.stringify(lessonData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '수업을 수정할 수 없습니다.');
      }
      
      return response.json();
    } catch (error) {
      console.error('수업 수정 실패:', error);
      throw error;
    }
  },

  // 수업 삭제
  deleteLesson: async (lessonId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '수업을 삭제할 수 없습니다.');
      }
      
      return { success: true };
    } catch (error) {
      console.error('수업 삭제 실패:', error);
      throw error;
    }
  },

  // 수업 상세 조회
  getLessonDetail: async (lessonId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '수업 정보를 불러올 수 없습니다.');
      }
      
      return response.json();
    } catch (error) {
      console.error('수업 상세 정보 조회 실패:', error);
      throw error;
    }
  },

  // 학습 진도 업데이트
  updateProgress: async (lessonId, progressData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: lessonService.getHeaders(token),
        body: JSON.stringify(progressData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '학습 진도를 업데이트할 수 없습니다.');
      }
      
      return response.json();
    } catch (error) {
      console.error('학습 진도 업데이트 실패:', error);
      throw error;
    }
  },

  // 학습 자료 업로드 (파일)
  uploadMaterial: async (lessonId, file, materialData, token) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', materialData.title);
      formData.append('description', materialData.description || '');

      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/materials`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
          // FormData 사용시 Content-Type 헤더는 브라우저가 자동 설정
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '학습 자료를 업로드할 수 없습니다.');
      }
      
      return response.json();
    } catch (error) {
      console.error('학습 자료 업로드 실패:', error);
      throw error;
    }
  },

  // 학습 자료 삭제
  deleteMaterial: async (materialId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
        method: 'DELETE',
        headers: lessonService.getHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '학습 자료를 삭제할 수 없습니다.');
      }
      
      return { success: true };
    } catch (error) {
      console.error('학습 자료 삭제 실패:', error);
      throw error;
    }
  },

  // 수업 데이터 유효성 검사 (실시간 수업 제거)
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
      // 'LIVE' 제거
      errors.push('올바른 수업 유형을 선택해주세요.');
    }

    if (!lessonData.classroomId) {
      errors.push('클래스룸 정보가 필요합니다.');
    }

    return errors;
  },

  // 수업 유형별 설정 검증 (LIVE 제거)
  validateLessonTypeSettings: (lessonType, settings) => {
    const errors = [];

    switch (lessonType) {
      case 'VIDEO':
        if (!settings.videoFile && !settings.videoUrl) {
          errors.push('영상 파일 또는 URL을 제공해주세요.');
        }
        break;
      case 'DOCUMENT':
        if (!settings.documentFile && !settings.documentUrl) {
          errors.push('문서 파일을 제공해주세요.');
        }
        break;
      default:
        errors.push('지원하지 않는 수업 유형입니다.');
    }

    return errors;
  }
};

export default lessonService;