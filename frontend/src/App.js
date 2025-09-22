import React, { useState, useEffect } from 'react';
import { Home, Calendar, Settings, Users, BookOpen, ClipboardList, HelpCircle, MessageSquare } from 'lucide-react';

import BoardPage from './pages/Board/BoardPage';
import AssignmentPage from './pages/Assignment/AssignmentPage';
import QuizPage from './pages/Quiz/QuizPage';
import LessonPage from './pages/Lesson/LessonPage';
import LessonForm from './pages/Lesson/LessonForm';

import { LoginModal, SignupModal } from './components/auth';
import { authApi, classroomApi } from './services/userApi';

import TopNavBar from './components/TopNavBar';
import ProfilePage from './components/ProfilePage';

function App() {
  // ============================================================================
  // 상태 관리 (기능 보존)
  // ============================================================================
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('token'));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);

  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [currentPage, setCurrentPage] = useState('board');
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 클래스룸 생성/참여 모달 상태 (기능 보존)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // ============================================================================
  // 사이드바/탭 (기능 보존)
  // ============================================================================
  const sidebarItems = [
    { icon: Home, label: '홈', active: !selectedClassroom },
    { icon: Calendar, label: '일정', active: false },
    { icon: Settings, label: '설정', active: false }
  ];

  const classroomTabs = [
    { id: 'board', label: '게시판', icon: MessageSquare },
    { id: 'lesson', label: '수업', icon: BookOpen },
    { id: 'assignment', label: '과제', icon: ClipboardList },
    { id: 'quiz', label: '퀴즈', icon: HelpCircle },
    { id: 'member', label: '멤버', icon: Users }
  ];

  // ============================================================================
  // 초기화 및 데이터 로딩 (기능 보존)
  // ============================================================================
  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = JSON.parse(localStorage.getItem('currentUser'));
          if (userData) {
            setCurrentUser(userData);
            setAccessToken(token);
            await loadClassrooms();
          }
        } catch (error) {
          console.error('초기화 실패:', error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // ============================================================================
  // 인증 관련 함수들 (기능 보존)
  // ============================================================================
  const handleLogin = async (loginData) => {
    try {
      const { email, password } = loginData;
      const data = await authApi.login(email, password);

      if (data && data.accessToken && data.user) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        setAccessToken(data.accessToken);
        setCurrentUser(data.user);
        setShowLoginModal(false);

        alert(data.message || '로그인에 성공했습니다!');
        await loadClassrooms();
      } else {
        throw new Error('서버에서 올바른 응답을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      alert(error.message || '로그인에 실패했습니다.');
    }
  };

  const handleSignup = async (userData) => {
    try {
      try {
        const isDuplicate = await authApi.checkEmailDuplicate(userData.email);
        if (isDuplicate) {
          alert('이미 사용 중인 이메일입니다.');
          return;
        }
      } catch (error) {
        console.warn('이메일 중복 체크 실패:', error);
      }

      const data = await authApi.signup(userData);

      if (data && data.accessToken && data.user) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        setAccessToken(data.accessToken);
        setCurrentUser(data.user);
        setShowSignupModal(false);

        alert(data.message || '회원가입에 성공했습니다!');
        await loadClassrooms();
      } else {
        throw new Error('서버에서 올바른 응답을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert(error.message || '회원가입에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAccessToken(null);
    setClassrooms([]);
    setSelectedClassroom(null);

    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  const handleGoogleLogin = () => {
    console.log('구글 로그인 시도');
    alert('구글 로그인 기능은 개발 중입니다.');
  };

  // ============================================================================
  // 클래스룸 관련 함수들 (기능 보존)
  // ============================================================================
  const loadClassrooms = async () => {
    try {
      const classroomData = await classroomApi.getClassrooms(accessToken);
      setClassrooms(classroomData || []);
    } catch (error) {
      console.error('클래스룸 로딩 실패:', error);
      alert(error.message || '클래스룸 목록을 불러오는데 실패했습니다.');
      setClassrooms([]);
    }
  };

  const handleCreateClassroom = async (classroomData) => {
    try {
      const newClassroom = await classroomApi.createClassroom(classroomData, accessToken);
      setClassrooms((prev) => [...prev, newClassroom]);
      setSelectedClassroom(newClassroom);
      alert('클래스룸이 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('클래스룸 생성 실패:', error);
      alert(error.message || '클래스룸 생성에 실패했습니다.');
    }
  };

  const handleJoinClassroom = async (classroomCode) => {
    try {
      const joinedClassroom = await classroomApi.joinClassroom(classroomCode, accessToken);
      setClassrooms((prev) => [...prev, joinedClassroom]);
      setSelectedClassroom(joinedClassroom);
      alert('클래스룸에 성공적으로 참여했습니다!');
    } catch (error) {
      console.error('클래스룸 참여 실패:', error);
      alert(error.message || '클래스룸 참여에 실패했습니다.');
    }
  };

  // ============================================================================
  // 모달 전환 함수들 (기능 보존)
  // ============================================================================
  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  // ============================================================================
  // 사용자 프로필 업데이트 (기능 보존)
  // ============================================================================
  const handleUpdateProfile = async (updatedData) => {
    try {
      setCurrentUser((prev) => ({ ...prev, ...updatedData }));
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...updatedData }));
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  };

  // ============================================================================
  // 모달 컴포넌트 (UI만 라이트 톤으로 변경)
  // ============================================================================
  const CreateClassroomModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">클래스룸 생성</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleCreateClassroom({
              name: formData.get('name'),
              description: formData.get('description')
            });
            setShowCreateModal(false);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm mb-2">클래스룸 이름</label>
              <input
                name="name"
                type="text"
                required
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="클래스룸 이름을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">설명</label>
              <textarea
                name="description"
                rows={3}
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="클래스룸 설명을 입력하세요"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">생성</button>
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">취소</button>
          </div>
        </form>
      </div>
    </div>
  );

  const JoinClassroomModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">클래스룸 참여</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleJoinClassroom(formData.get('code'));
            setShowJoinModal(false);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm mb-2">참여 코드</label>
              <input
                name="code"
                type="text"
                required
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="참여 코드를 입력하세요"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">참여</button>
            <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">취소</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ============================================================================
  // 페이지 렌더링 (기능 보존)
  // ============================================================================
  const renderCurrentPage = () => {
    if (!selectedClassroom) {
      return (
        <div className="bg-white rounded-xl p-8 m-6 text-center shadow">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">EDDIE에 오신 것을 환영합니다!</h2>
          <p className="text-gray-600 mb-6">클래스룸을 선택하거나 새로 만들어 학습을 시작하세요.</p>
          <div className="flex justify-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600" onClick={() => setShowCreateModal(true)}>클래스룸 만들기</button>
            <button className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300" onClick={() => setShowJoinModal(true)}>클래스룸 참여</button>
          </div>
        </div>
      );
    }

    const commonProps = {
      classroomId: selectedClassroom.classroomId,
      currentUser,
      accessToken,
      classroom: selectedClassroom
    };

    switch (currentPage) {
      case 'board':
        return <BoardPage {...commonProps} />;
      case 'lesson':
        return <LessonPage {...commonProps} />;
      case 'assignment':
        return <AssignmentPage {...commonProps} />;
      case 'quiz':
        return <QuizPage {...commonProps} />;
      case 'member':
        return (
          <div className="bg-white rounded-xl p-6 m-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">멤버 페이지</h2>
            <p className="text-gray-600">멤버 관리 기능이 곧 추가됩니다.</p>
          </div>
        );
      default:
        return <BoardPage {...commonProps} />;
    }
  };

  // ============================================================================
  // 로딩 화면 (UI만 라이트 톤)
  // ============================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center shadow">
          <div className="animate-pulse text-4xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900">EDDIE</h2>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 로그인 페이지 (비로그인 상태) - UI만 라이트 톤
  // ============================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">EDDIE</h1>
              <p className="text-sm text-gray-500">Enhanced Design System for Education</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">로그인</button>
              <button onClick={() => setShowSignupModal(true)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">회원가입</button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl p-12 text-center shadow max-w-2xl">
            <div className="text-8xl mb-6">🎓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">차세대 학습 플랫폼</h2>
            <p className="text-gray-600 mb-8">EDDIE와 함께 더 스마트하고 효율적인 학습 경험을 만나보세요. 실시간 소통, 과제 관리, 퀴즈 시스템까지 모든 것이 하나로.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowSignupModal(true)} className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">🚀 시작하기</button>
              <button onClick={() => setShowLoginModal(true)} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">로그인</button>
            </div>
          </div>
        </div>

        {/* 로그인/회원가입 모달 */}
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
            onSwitchToSignup={switchToSignup}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {showSignupModal && (
          <SignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
            onSignup={handleSignup}
            onSwitchToLogin={switchToLogin}
            onGoogleSignup={handleGoogleLogin}
          />
        )}
      </div>
    );
  }

  // ============================================================================
  // 메인 애플리케이션 (로그인된 상태) - UI만 라이트 톤
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단바 */}
      {currentUser && (
        <TopNavBar user={currentUser} onLogout={handleLogout} onProfileClick={() => setShowProfilePage(true)} />
      )}

      {/* 프로필 페이지 모달 */}
      {showProfilePage && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm">
          <ProfilePage user={currentUser} onUpdateProfile={handleUpdateProfile} onClose={() => setShowProfilePage(false)} />
        </div>
      )}

      {/* 클래스룸 생성/참여 모달 */}
      {showCreateModal && <CreateClassroomModal />}
      {showJoinModal && <JoinClassroomModal />}

      <div className="flex h-screen pt-16">
        {/* 사이드바 */}
        <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
          {/* 사이드바 헤더 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-blue-600">EDDIE</h2>
            <p className="text-gray-500 text-sm">학습 관리 시스템</p>
          </div>

          {/* 네비게이션 메뉴 */}
          <div className="p-4">
            <div className="space-y-2">
              {sidebarItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => item.label === '홈' && setSelectedClassroom(null)}
                    className={`flex items-center w-full px-3 py-2 rounded-lg transition ${item.active ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <IconComponent size={20} />
                    <span className="ml-3">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 클래스룸 목록 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 text-sm font-medium">내 클래스룸</h3>
              <div className="flex gap-1">
                <button onClick={() => setShowCreateModal(true)} className="text-gray-500 hover:text-gray-700 text-xs p-1" title="새 클래스룸">➕</button>
                <button onClick={() => setShowJoinModal(true)} className="text-gray-500 hover:text-gray-700 text-xs p-1" title="클래스룸 참여">🔗</button>
              </div>
            </div>
            <div className="space-y-2">
              {classrooms.map((classroom) => (
                <button
                  key={classroom.classroomId}
                  onClick={() => setSelectedClassroom(classroom)}
                  className={`block w-full text-left px-3 py-2 rounded-lg truncate ${selectedClassroom?.classroomId === classroom.classroomId ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  {classroom.classroomName}
                </button>
              ))}

              {classrooms.length === 0 && (
                <div className="text-gray-400 text-sm text-center py-4">클래스룸이 없습니다</div>
              )}
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col">
          {/* 클래스룸 탭 (클래스룸 선택 시에만 표시) */}
          {selectedClassroom && (
            <div className="bg-white m-6 mb-0 p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedClassroom.classroomName}</h2>
                  <p className="text-gray-600">{selectedClassroom.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {classroomTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const active = currentPage === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentPage(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-lg border ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                    >
                      <IconComponent size={16} />
                      <span className="ml-2">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 페이지 콘텐츠 */}
          <div className="flex-1 overflow-auto">{renderCurrentPage()}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
