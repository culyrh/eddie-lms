import React, { useState, useEffect } from 'react';
import { Home, Calendar, Settings, Users, BookOpen, ClipboardList, HelpCircle, MessageSquare } from 'lucide-react';

import BoardPage from './pages/Board/BoardPage';
import AssignmentPage from './pages/Assignment/AssignmentPage';
import QuizPage from './pages/Quiz/QuizPage';
import LessonPage from './pages/Lesson/LessonPage';
import LessonForm from './pages/Lesson/LessonForm';

import SignupModal from './components/SignupModal';

import TopNavBar from './components/TopNavBar';
import ProfilePage from './components/ProfilePage';

// ============================================================================
// API 호출 함수들
// ============================================================================
const api = {
  baseURL: 'http://localhost:8080/api',

  // 헤더에 JWT 토큰 추가하는 헬퍼 함수
  getAuthHeaders: (token) => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  }),
  
  // 사용자 목록 조회 - JWT 토큰 필요로 수정
  getUsers: async (token) => {
    const response = await fetch(`${api.baseURL}/users`, {
      headers: api.getAuthHeaders(token)
    });
    
    if (!response.ok) {
      throw new Error('사용자 목록 조회 실패');
    }
    
    return response.json();
  },

  // 회원가입
  register: async (userData) => {
    const response = await fetch(`${api.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '회원가입에 실패했습니다.');
    }
    
    return data; // { accessToken, user, message } 형태로 반환
  },

  // 이메일 중복 체크 (새로 추가)
  checkEmailDuplicate: async (email) => {
    const response = await fetch(`${api.baseURL}/auth/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('이메일 중복 체크에 실패했습니다.');
    }
    
    return response.json(); // { exists: boolean, message: string }
  },

  // 일반 로그인
  login: async (email, password) => {
    const response = await fetch(`${api.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('로그인 실패');
    }
    
    return response.json(); // { accessToken, user } 형태로 반환
  },

  // Google OAuth 로그인 URL 생성
  getGoogleLoginUrl: () => {
    return `${api.baseURL.replace('/api', '')}/oauth2/authorization/google`;
  },
  
  // 내 클래스룸 목록 조회 (JWT 토큰 사용)
  getMyClassrooms: async (userId, token) => {
    const response = await fetch(`${api.baseURL}/classrooms/my-classrooms?userId=${userId}`, {
      headers: api.getAuthHeaders(token)
    });
    
    if (!response.ok) {
      throw new Error('클래스룸 목록 조회 실패');
    }
    
    return response.json();
  },
  
  // 클래스룸 생성 (JWT 토큰 사용)
  createClassroom: async (educatorId, data, token) => {
    const response = await fetch(`${api.baseURL}/classrooms?educatorId=${educatorId}`, {
      method: 'POST',
      headers: api.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('클래스룸 생성 실패');
    }
    
    return response.json();
  },
  
  // 클래스룸 참여 (JWT 토큰 사용)
  joinClassroom: async (userId, classroomCode, token) => {
    const response = await fetch(`${api.baseURL}/classrooms/join?userId=${userId}`, {
      method: 'POST',
      headers: api.getAuthHeaders(token),
      body: JSON.stringify({ classroomCode }),
    });
    
    if (!response.ok) {
      throw new Error('클래스룸 참여 실패');
    }
    
    return response.json();
  }
};



// ============================================================================
// 모달 컴포넌트들
// ============================================================================

// 로그인 모달 컴포넌트
const LoginModal = ({ onClose, onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      setIsLoading(true);
      try {
        await onLogin(email, password);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">이메일 로그인</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="이메일을 입력하세요"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>

        {/* 회원가입 링크 추가 */}
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            계정이 없으신가요?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              회원가입하기
            </button>
          </p>
        </div> 
      </div>
    </div>
  );
};

// 클래스룸 생성 모달
const CreateClassroomModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    classroomName: '',
    description: ''
  });

  const handleSubmit = () => {
    if (formData.classroomName.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">클래스룸 생성</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">클래스룸 이름</label>
            <input
              type="text"
              value={formData.classroomName}
              onChange={(e) => setFormData({...formData, classroomName: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="클래스룸 이름을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md h-20"
              placeholder="클래스룸 설명을 입력하세요"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 클래스룸 참여 모달
const JoinClassroomModal = ({ onClose, onSubmit }) => {
  const [classroomCode, setClassroomCode] = useState('');

  const handleSubmit = () => {
    if (classroomCode.trim()) {
      onSubmit(classroomCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">클래스룸 참여</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">클래스룸 코드</label>
            <input
              type="text"
              value={classroomCode}
              onChange={(e) => setClassroomCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="클래스룸 코드를 입력하세요"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              참여
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 메인 애플리케이션 컴포넌트
// ============================================================================
const EddieApp = () => {
  // State 관리
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [activeTab, setActiveTab] = useState('게시판');
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);

  // OAuth 리다이렉트 처리
  useEffect(() => {
    const handleOAuthRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userId = urlParams.get('userId');
      const email = urlParams.get('email');
      const name = urlParams.get('name');
      const userType = urlParams.get('userType');

      if (token && userId) {
        // OAuth 로그인 성공
        const user = {
          userId: parseInt(userId),
          email: decodeURIComponent(email),
          name: decodeURIComponent(name),
          userType: userType,
          isActive: true
        };

        setCurrentUser(user);
        setAccessToken(token);
        
        // URL에서 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('OAuth 로그인 성공:', user);
      }
    };

    handleOAuthRedirect();
  }, []);

  // 사용자 목록 로드 함수
  const loadUsers = async () => {
    // 로그인되어 있을 때만 사용자 목록 로드
    if (!accessToken) {
      console.log('로그인되지 않아 사용자 목록을 로드하지 않습니다.');
      return;
    }

    try {
      const data = await api.getUsers(accessToken);  // 토큰 전달
      setUsers(data);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
      // 토큰이 만료된 경우 로그아웃 처리
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        handleLogout();
      }
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    setAccessToken(null);
    setCurrentUser(null);
    setUsers([]);
    setClassrooms([]);
    setSelectedClassroom(null);
    setShowProfilePage(false); // 추가
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
  };

  // useEffect 수정 - 로그인 상태일 때만 사용자 목록 로드
  useEffect(() => {
    if (accessToken && currentUser) {
      loadUsers();
    }
  }, [accessToken, currentUser]);

  // 클래스룸 목록 로드
  useEffect(() => {
    if (currentUser && accessToken) {
      loadClassrooms();
    }
  }, [currentUser, accessToken]);

  // ============================================================================
  // 이벤트 핸들러들
  // ============================================================================

  // 일반 로그인 처리
  const handleLogin = async (email, password) => {
    try {
      const loginResponse = await api.login(email, password);
      setCurrentUser(loginResponse.user);
      setAccessToken(loginResponse.accessToken);
      setShowLoginModal(false);
      console.log('로그인 성공:', loginResponse);
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다.');
    }
  };

  // 회원가입 핸들러 함수 추가
  const handleSignup = async (userData) => {
    try {
      const signupResponse = await api.register(userData);
    
      // 회원가입 성공 시 바로 로그인 상태로 설정
      setCurrentUser(signupResponse.user);
      setAccessToken(signupResponse.accessToken);
    
      // 로컬 스토리지에 저장 (선택사항)
      localStorage.setItem('accessToken', signupResponse.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(signupResponse.user));
    
      setShowSignupModal(false);
      console.log('회원가입 및 로그인 성공:', signupResponse);
    
      // 성공 메시지 표시
      alert(signupResponse.message || '회원가입이 완료되었습니다!');
    
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error; // SignupModal에서 에러 처리
    }
  };

  // Google OAuth 로그인 처리
  const handleGoogleLogin = () => {
    window.location.href = api.getGoogleLoginUrl();
  };

  // 개발용 사용자 선택 (토큰 없이 임시로 사용)
  const handleDevUserSelect = (user) => {
    setCurrentUser(user);
    setAccessToken('dev-token'); // 개발용 임시 토큰
    setSelectedClassroom(null);
  };

  // 클래스룸 목록 로드
  const loadClassrooms = async () => {
    if (!currentUser || !accessToken) return;
    
    try {
      setIsLoading(true);
      const classroomList = await api.getMyClassrooms(currentUser.userId, accessToken);
      setClassrooms(classroomList);
      if (classroomList.length > 0 && !selectedClassroom) {
        setSelectedClassroom(classroomList[0]);
      }
    } catch (error) {
      console.error('클래스룸 목록 로드 실패:', error);
      // 토큰 만료 시 로그아웃
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 클래스룸 생성
  const handleCreateClassroom = async (data) => {
    try {
      const newClassroom = await api.createClassroom(currentUser.userId, data, accessToken);
      await loadClassrooms();
      setShowCreateModal(false);
      setSelectedClassroom(newClassroom);
    } catch (error) {
      console.error('클래스룸 생성 실패:', error);
      alert('클래스룸 생성에 실패했습니다.');
    }
  };

  // 클래스룸 참여
  const handleJoinClassroom = async (classroomCode) => {
    try {
      await api.joinClassroom(currentUser.userId, classroomCode, accessToken);
      await loadClassrooms();
      setShowJoinModal(false);
    } catch (error) {
      console.error('클래스룸 참여 실패:', error);
      alert('클래스룸 참여에 실패했습니다.');
    }
  };

  // 프로필 업데이트
  const handleUpdateProfile = async (updateData) => {
    try {
      const response = await fetch(`${api.baseURL}/users/me`, {
        method: 'PUT',
        headers: api.getAuthHeaders(accessToken),
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
        return updatedUser;
      } else {
        throw new Error('프로필 업데이트 실패');
      }
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  };


  // 모달 전환 함수들 추가
  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };


  // ============================================================================
  // 렌더링 함수들
  // ============================================================================

  // 탭별 컨텐츠 렌더링
  const renderContent = () => {
    if (!selectedClassroom) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">클래스룸을 선택해주세요.</p>
        </div>
      );
    }

    switch (activeTab) {
      case '게시판':
        return (
          <BoardPage
            classroomId={selectedClassroom.classroomId}
            currentUser={currentUser}
            accessToken={accessToken}
          />
        );
      case '과제':
        return (
          <AssignmentPage
            classroomId={selectedClassroom.classroomId}
            currentUser={currentUser}
            accessToken={accessToken}
          />
        );
      case '수업':
        return (
          <LessonPage 
            classroomId={selectedClassroom?.classroomId}
            selectedClassroom={selectedClassroom} 
            currentUser={currentUser}
            accessToken={accessToken}  // currentUser?.token이 아닌 accessToken 사용
          />
        );
      case '퀴즈':
        return (
          <QuizPage
            classroomId={selectedClassroom.classroomId}
            currentUser={currentUser}
            accessToken={accessToken}
          />
        );
      case '멤버':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">멤버 페이지 - 곧 구현 예정</p>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
          </div>
        );
    }
  };

  // 사이드바 아이템 설정
  const sidebarItems = [
    { icon: Home, label: '홈', active: !selectedClassroom },
    { icon: Calendar, label: '일정' },
    { icon: Settings, label: '설정' }
  ];

  // 탭 설정
  const tabs = ['게시판', '수업', '과제', '퀴즈', '멤버'];

  // ============================================================================
  // 메인 렌더링
  // ============================================================================

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">EDDIE LMS</h2>
          
          {/* Google OAuth 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full mb-4 px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google로 로그인</span>
          </button>

          <div className="text-center text-gray-500 mb-4">또는</div>
          
          {/* 일반 로그인 버튼 */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full mb-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            이메일로 로그인
          </button>

          {/* 회원가입 버튼 */}
          <button
            onClick={() => setShowSignupModal(true)}
            className="w-full mb-6 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
           회원가입
          </button>

          {/* 개발용 사용자 선택 */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">개발용 사용자 선택</h3>
            <div className="space-y-2">
              {users.map(user => (
                <button
                  key={user.userId}
                  onClick={() => handleDevUserSelect(user)}
                  className="w-full p-2 text-left border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                  {user.name} ({user.userType})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 로그인 모달 */}
        {showLoginModal && (
          <LoginModal 
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
            onSwitchToSignup={switchToSignup}
          />
        )}

        {showSignupModal && (
          <SignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
            onSignup={handleSignup}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </div>
    );
  }

  // 로그인된 상태 - 메인 애플리케이션
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 상단바 - 전체 화면 상단에 고정 */}
      {currentUser && (
        <TopNavBar 
          user={currentUser} 
          onLogout={handleLogout}
          onProfileClick={() => setShowProfilePage(true)}
        />
      )}

      {/* 프로필 페이지 모달 */}
      {showProfilePage && (
        <div className="fixed inset-0 bg-white z-50">
          <ProfilePage 
            user={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onClose={() => setShowProfilePage(false)}
          />
        </div>
      )}

      {/* 사이드바 - 상단바 아래로 위치 조정 */}
      <div className={`w-64 bg-white border-r border-gray-200 flex flex-col ${
        currentUser ? 'mt-16' : ''
      }`}>
        {/* 네비게이션 메뉴 */}
        <div className="p-4">
          <div className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                onClick={() => item.label === '홈' && setSelectedClassroom(null)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  item.active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 클래스룸 목록 */}
        <div className="flex-1 px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">클래스룸</h3>
            <div className="flex space-x-1">
              {currentUser?.userType === 'EDUCATOR' && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  생성
                </button>
              )}
              <button 
                onClick={() => setShowJoinModal(true)}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                참여
              </button>
            </div>
          </div>
        
          {isLoading ? (
            <div className="text-sm text-gray-500">로딩 중...</div>
          ) : (
            <div className="space-y-1">
              {classrooms.map((classroom) => (
                <button
                  key={classroom.classroomId}
                  onClick={() => setSelectedClassroom(classroom)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                    selectedClassroom?.classroomId === classroom.classroomId
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{classroom.classroomName}</div>
                  <div className="text-xs text-gray-500">{classroom.educatorName}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 - 상단바 아래로 위치 조정 */}
      <div className={`flex-1 flex flex-col overflow-hidden ${
        currentUser ? 'mt-16' : ''
      }`}>
        {/* 탭 네비게이션 */}
        {selectedClassroom && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium transition-colors relative ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 페이지 컨텐츠 */}
        <div className="flex-1 overflow-auto">
          {selectedClassroom ? (
            renderContent()
          ) : (
            // 홈 화면 - 클래스룸 목록
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm p-6 h-full">
                <h2 className="text-xl font-semibold mb-4">홈</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map((classroom) => (
                    <button
                      key={classroom.classroomId}
                      onClick={() => setSelectedClassroom(classroom)}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
                    >
                      <h3 className="font-medium">{classroom.classroomName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{classroom.educatorName}</p>
                      <p className="text-xs text-gray-500 mt-2">멤버 {classroom.memberCount || 0}명</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모달들 */}
      {showCreateModal && (
        <CreateClassroomModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateClassroom}
        />
      )}

      {showJoinModal && (
        <JoinClassroomModal 
          onClose={() => setShowJoinModal(false)}
          onSubmit={handleJoinClassroom}
        />
      )}
    </div>
  );
};

export default EddieApp;