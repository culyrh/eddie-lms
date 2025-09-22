const API_BASE_URL = 'http://localhost:8080/api';

// API 요청을 위한 기본 헤더 생성
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API 응답 처리 - 백엔드와 호환
const handleResponse = async (response) => {
  const responseText = await response.text();
  let data;
  
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    // 백엔드 에러 응답 처리: {success: false, message: "", timestamp: ""}
    const errorMessage = data.message || `HTTP ${response.status} 오류가 발생했습니다.`;
    
    if (response.status === 401) {
      // 인증 오류 시 토큰 제거
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    
    throw new Error(errorMessage);
  }
  
  return data;
};

// 사용자 API 서비스
export const userApi = {
  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  },

  // 사용자 정보 수정
  updateUser: async (updateData) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updateData)
    });
    
    return handleResponse(response);
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/profile-image`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
      body: formData // FormData는 Content-Type을 자동으로 설정
    });
    
    return handleResponse(response);
  },

  // 특정 사용자 정보 조회 (관리자용)
  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  },

  // 모든 사용자 조회 (관리자용)
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  }
};

// 인증 API 서비스 - 백엔드와 완전 호환
export const authApi = {
  // 로그인 - 백엔드 LoginRequest/LoginResponse와 호환
  login: async (email, password) => {
    console.log('로그인 시도:', { email, password: '***' });
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ 
        email: email.trim(),
        password 
      })
    });
    
    const result = await handleResponse(response);
    console.log('로그인 응답:', result);
    
    return result;
  },

  // 회원가입 - 백엔드 UserCreateRequest/RegisterResponse와 호환
  signup: async (userData) => {
    console.log('회원가입 시도:', { ...userData, password: '***' });
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: userData.email.trim(),
        password: userData.password,
        name: userData.name.trim(),
        userType: userData.userType || 'STUDENT' // 기본값 설정
      })
    });
    
    const result = await handleResponse(response);
    console.log('회원가입 응답:', result);
    
    return result;
  },

  // 이메일 중복 확인
  checkEmailDuplicate: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email.trim())}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const result = await handleResponse(response);
    return result.exists; // 백엔드에서 { exists: boolean, message: string } 반환
  },

  // 로그아웃
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  }
};

// 클래스룸 API 서비스 - 실제 백엔드 API 사용
export const classroomApi = {
  // 내 클래스룸 목록 조회
  getClassrooms: async (token) => {
    // 현재 사용자 정보에서 userId 가져오기
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.userId;
    
    if (!userId) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const response = await fetch(`${API_BASE_URL}/classrooms/my-classrooms?userId=${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  },

  // 클래스룸 생성
  createClassroom: async (classroomData, token) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const educatorId = currentUser.userId;
    
    if (!educatorId) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const response = await fetch(`${API_BASE_URL}/classrooms?educatorId=${educatorId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        classroomName: classroomData.name,
        description: classroomData.description
      })
    });
    
    return handleResponse(response);
  },

  // 클래스룸 참여
  joinClassroom: async (classroomCode, token) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.userId;
    
    if (!userId) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const response = await fetch(`${API_BASE_URL}/classrooms/join?userId=${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ 
        classroomCode: classroomCode 
      })
    });
    
    return handleResponse(response);
  },

  // 클래스룸 멤버 조회
  getClassroomMembers: async (classroomId, token) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/members`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  },

  // 특정 클래스룸 정보 조회
  getClassroom: async (classroomId, token) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  }
};

// 파일 업로드 API 서비스
export const uploadApi = {
  // 일반 파일 업로드
  uploadFile: async (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
      body: formData
    });
    
    return handleResponse(response);
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return userApi.uploadProfileImage(formData);
  }
};

// API 오류 처리 유틸리티
export const apiErrorHandler = {
  // 네트워크 오류 처리
  handleNetworkError: (error) => {
    console.error('네트워크 오류:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
    }
    return '네트워크 연결을 확인해주세요.';
  },

  // 일반 API 오류 처리
  handleApiError: (error) => {
    console.error('API 오류:', error);
    
    if (error.message.includes('401')) {
      return '인증이 필요합니다. 다시 로그인해주세요.';
    } else if (error.message.includes('403')) {
      return '접근 권한이 없습니다.';
    } else if (error.message.includes('404')) {
      return '요청한 데이터를 찾을 수 없습니다.';
    } else if (error.message.includes('500')) {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    return error.message || '알 수 없는 오류가 발생했습니다.';
  }
};

// 기본 export
export default { userApi, authApi, classroomApi, uploadApi, apiErrorHandler };