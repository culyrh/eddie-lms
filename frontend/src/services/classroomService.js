const API_BASE_URL = 'http://localhost:8080/api';

// API 요청을 위한 기본 헤더 생성
const getAuthHeaders = (token) => {
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API 응답 처리
const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    } else if (response.status === 403) {
      throw new Error('접근 권한이 없습니다.');
    } else if (response.status === 404) {
      throw new Error('요청한 클래스룸을 찾을 수 없습니다.');
    } else if (response.status === 500) {
      throw new Error('서버 오류가 발생했습니다.');
    }
    
    const errorData = await response.text();
    throw new Error(errorData || '서버 오류가 발생했습니다.');
  }
  
  return response.json();
};

const classroomService = {
  
  // ============================================================================
  // 클래스룸 CRUD
  // ============================================================================

  // 내 클래스룸 목록 조회 - 실제 API 호출
  getMyClassrooms: async (userId, token) => {
    try {
      console.log(`🔍 클래스룸 목록 조회: userId=${userId}`);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/my-classrooms?userId=${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
        credentials: 'include'
      });
      
      const data = await handleResponse(response);
      console.log('✅ 클래스룸 목록 조회 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 클래스룸 목록 조회 실패:', error);
      throw error;
    }
  },

  // 특정 클래스룸 정보 조회
  getClassroom: async (classroomId, token) => {
    try {
      console.log(`🔍 클래스룸 정보 조회: classroomId=${classroomId}`);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
        credentials: 'include'
      });
      
      const data = await handleResponse(response);
      console.log('✅ 클래스룸 정보 조회 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 클래스룸 정보 조회 실패:', error);
      throw error;
    }
  },

  // 클래스룸 생성
  createClassroom: async (educatorId, classroomData, token) => {
    try {
      console.log(`🔨 클래스룸 생성: educatorId=${educatorId}`, classroomData);
      
      const response = await fetch(`${API_BASE_URL}/classrooms?educatorId=${educatorId}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify(classroomData)
      });
      
      const data = await handleResponse(response);
      console.log('✅ 클래스룸 생성 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 클래스룸 생성 실패:', error);
      throw error;
    }
  },

  // 클래스룸 참여
  joinClassroom: async (userId, classroomCode, token) => {
    try {
      console.log(`🚪 클래스룸 참여: userId=${userId}, code=${classroomCode}`);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/join?userId=${userId}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ classroomCode })
      });
      
      const data = await handleResponse(response);
      console.log('✅ 클래스룸 참여 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 클래스룸 참여 실패:', error);
      throw error;
    }
  },

  // 클래스룸 멤버 목록 조회
  getClassroomMembers: async (classroomId, token) => {
    try {
      console.log(`👥 클래스룸 멤버 조회: classroomId=${classroomId}`);
      
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/members`, {
        method: 'GET',
        headers: getAuthHeaders(token),
        credentials: 'include'
      });
      
      const data = await handleResponse(response);
      console.log('✅ 클래스룸 멤버 조회 성공:', data);
      return data;
      
    } catch (error) {
      console.error('❌ 클래스룸 멤버 조회 실패:', error);
      throw error;
    }
  },

  // ============================================================================
  // 유틸리티 함수들
  // ============================================================================

  // 클래스룸 데이터 유효성 검사
  validateClassroomData: (classroomData) => {
    const errors = [];

    if (!classroomData.classroomName?.trim()) {
      errors.push('클래스룸 이름을 입력해주세요.');
    } else if (classroomData.classroomName.length > 100) {
      errors.push('클래스룸 이름은 100자 이내로 입력해주세요.');
    }

    if (classroomData.description && classroomData.description.length > 500) {
      errors.push('설명은 500자 이내로 입력해주세요.');
    }

    return errors;
  },

  // API 오류 처리
  handleApiError: (error) => {
    console.error('API 오류:', error);
    
    if (error.message.includes('401')) {
      return '인증이 필요합니다. 다시 로그인해주세요.';
    } else if (error.message.includes('403')) {
      return '접근 권한이 없습니다.';
    } else if (error.message.includes('404')) {
      return '요청한 클래스룸을 찾을 수 없습니다.';
    } else if (error.message.includes('500')) {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    return error.message || '알 수 없는 오류가 발생했습니다.';
  }
};

export default classroomService;