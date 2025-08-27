import api from './api';

/**
 * 수업 관련 API 서비스
 */
const lessonService = {
  /**
   * 클래스룸의 수업 목록 조회
   */
  getLessonsByClassroom: async (classroomId, token) => {
    try {
      const response = await api.get(`/classrooms/${classroomId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('수업 목록 조회 실패:', error);
      throw new Error(error.response?.data?.message || '수업 목록을 불러올 수 없습니다.');
    }
  },

  /**
   * 클래스룸의 커리큘럼 목록 조회
   */
  getCurriculumsByClassroom: async (classroomId, token) => {
    try {
      const response = await api.get(`/classrooms/${classroomId}/curriculums`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('커리큘럼 조회 실패:', error);
      throw new Error(error.response?.data?.message || '커리큘럼을 불러올 수 없습니다.');
    }
  },

  /**
   * 새 수업 생성
   */
  createLesson: async (lessonData, token) => {
    try {
      const response = await api.post('/lessons', lessonData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('수업 생성 실패:', error);
      throw new Error(error.response?.data?.message || '수업을 생성할 수 없습니다.');
    }
  },

  /**
   * 수업 정보 수정
   */
  updateLesson: async (lessonId, lessonData, token) => {
    try {
      const response = await api.put(`/lessons/${lessonId}`, lessonData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('수업 수정 실패:', error);
      throw new Error(error.response?.data?.message || '수업을 수정할 수 없습니다.');
    }
  },

  /**
   * 수업 삭제
   */
  deleteLesson: async (lessonId, token) => {
    try {
      await api.delete(`/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return { success: true };
    } catch (error) {
      console.error('수업 삭제 실패:', error);
      throw new Error(error.response?.data?.message || '수업을 삭제할 수 없습니다.');
    }
  },

  /**
   * 특정 수업 상세 정보 조회
   */
  getLessonDetail: async (lessonId, token) => {
    try {
      const response = await api.get(`/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('수업 상세 정보 조회 실패:', error);
      throw new Error(error.response?.data?.message || '수업 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 학습 진도 업데이트
   */
  updateProgress: async (lessonId, progressData, token) => {
    try {
      const response = await api.post(`/lessons/${lessonId}/progress`, progressData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('학습 진도 업데이트 실패:', error);
      throw new Error(error.response?.data?.message || '학습 진도를 업데이트할 수 없습니다.');
    }
  },

  /**
   * 학습 자료 업로드
   */
  uploadMaterial: async (lessonId, file, materialData, token) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', materialData.title);
      formData.append('description', materialData.description || '');

      const response = await api.post(`/lessons/${lessonId}/materials`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('학습 자료 업로드 실패:', error);
      throw new Error(error.response?.data?.message || '학습 자료를 업로드할 수 없습니다.');
    }
  },

  /**
   * 학습 자료 삭제
   */
  deleteMaterial: async (materialId, token) => {
    try {
      await api.delete(`/materials/${materialId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return { success: true };
    } catch (error) {
      console.error('학습 자료 삭제 실패:', error);
      throw new Error(error.response?.data?.message || '학습 자료를 삭제할 수 없습니다.');
    }
  },

  /**
   * 수업 데이터 유효성 검사
   */
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
    } else if (!['VIDEO', 'DOCUMENT', 'LIVE'].includes(lessonData.lessonType)) {
      errors.push('올바른 수업 유형을 선택해주세요.');
    }

    if (!lessonData.scheduledAt) {
      errors.push('수업 일정을 설정해주세요.');
    }

    if (!lessonData.durationMinutes || lessonData.durationMinutes < 1) {
      errors.push('수업 시간을 올바르게 설정해주세요.');
    } else if (lessonData.durationMinutes > 480) {
      errors.push('수업 시간은 8시간(480분)을 초과할 수 없습니다.');
    }

    if (!lessonData.classroomId) {
      errors.push('클래스룸 정보가 필요합니다.');
    }

    return errors;
  },

  /**
   * 수업 유형별 설정 검증
   */
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
      case 'LIVE':
        if (!settings.meetingUrl && !settings.streamKey) {
          errors.push('라이브 수업 설정이 필요합니다.');
        }
        break;
      default:
        errors.push('지원하지 않는 수업 유형입니다.');
    }

    return errors;
  }
};

export default lessonService;