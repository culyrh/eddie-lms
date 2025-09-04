const API_BASE_URL = 'http://localhost:8080/api';

// API 요청을 위한 기본 헤더 생성
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API 응답 처리
const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // 인증 오류 시 토큰 제거 및 로그인 페이지로 리다이렉트
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    
    const errorData = await response.text();
    throw new Error(errorData || '서버 오류가 발생했습니다.');
  }
  
  return response.json();
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

// 인증 API 서비스
export const authApi = {
  // 로그인
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    return handleResponse(response);
  },

  // 회원가입
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
  },

  // 로그아웃
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return handleResponse(response);
  },

  // 토큰 갱신
  refreshToken: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
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

export default { userApi, authApi, uploadApi, apiErrorHandler };