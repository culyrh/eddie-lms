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
  // 초기화 및 데이터 로딩 (수정)
  // ============================================================================
  useEffect(() => {
    // 로그인 상태 복원
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setAccessToken(savedToken);
      } catch (error) {
        console.error('사용자 정보 복원 실패:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
    
    setIsLoading(false);
  }, []);

  // 사용자 로그인시 클래스룸 데이터 로드
  useEffect(() => {
    if (currentUser && accessToken) {
      loadClassrooms();
    }
  }, [currentUser, accessToken]);

  // ============================================================================
  // 이벤트 핸들러들 (기능 보존 및 수정)
  // ============================================================================

  const handleLogin = async (loginData) => {
    try {
      const response = await authApi.login(loginData.email, loginData.password);
      
      if (response && response.user && response.accessToken) {
        setCurrentUser(response.user);
        setAccessToken(response.accessToken);
        
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('token', response.accessToken);
        
        setShowLoginModal(false);
        await loadClassrooms();
      } else {
        throw new Error('서버에서 올바른 응답을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      alert(error.message || '로그인에 실패했습니다.');
    }
  };

  const handleSignup = async (signupData) => {
    try {
      const response = await authApi.signup(signupData);
      
      if (response && response.user && response.accessToken) {
        setCurrentUser(response.user);
        setAccessToken(response.accessToken);
        
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('token', response.accessToken);
        
        setShowSignupModal(false);
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
  // 클래스룸 관련 함수들 (기능 보존 및 수정)
  // ============================================================================
  const loadClassrooms = async () => {
    if (!currentUser) return;
    
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
  // 모달 컴포넌트 (기존 그대로)
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
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="클래스룸 이름을 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-gray-600 text-sm mb-2">설명 (선택사항)</label>
              <textarea
                name="description"
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                rows="3"
                placeholder="클래스룸에 대한 설명을 입력하세요"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              생성
            </button>
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
              <label className="block text-gray-600 text-sm mb-2">클래스룸 코드</label>
              <input
                name="code"
                type="text"
                required
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="클래스룸 코드를 입력하세요"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              참여
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ============================================================================
  // 로딩 화면 (기존 그대로)
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
  // 로그인 페이지 (비로그인 상태) - 기존 그대로
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
            <p className="text-gray-600 mb-8">EDDIE와 함께 더 스마트하고 효율적인 학습 경험을 만나보세요.
            <br />실시간 소통, 과제 관리, 퀴즈 시스템까지 모든 것이 하나로.</p>
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
  // 메인 애플리케이션 (로그인된 상태) - 기존 3단 레이아웃 복원
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      {/* 메인 3단 레이아웃 */}
      <div className="flex flex-1 h-screen pt-16">
        {/* 왼쪽 사이드바 */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          {/* 홈 섹션 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">NAVIGATION</h3>
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => setSelectedClassroom(null)}
                    className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${
                      item.active
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent size={20} className="mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 클래스룸 섹션 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500">CLASSROOMS</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 text-gray-400 hover:text-blue-500 text-xs"
                  title="생성"
                >
                  ➕
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="p-1 text-gray-400 hover:text-blue-500 text-xs"
                  title="참여"
                >
                  🔗
                </button>
              </div>
            </div>
            
            {/* 클래스룸 목록 */}
            <div className="space-y-1">
              {classrooms.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  아직 참여한<br />클래스룸이 없습니다
                </p>
              ) : (
                classrooms.map((classroom) => (
                  <button
                    key={classroom.classroomId || classroom.id}
                    onClick={() => setSelectedClassroom(classroom)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedClassroom?.classroomId === classroom.classroomId
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">
                      {classroom.classroomName || classroom.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {classroom.description || '설명 없음'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 중앙 콘텐츠 영역 */}
        <div className="flex-1">
          {selectedClassroom ? (
            <div className="flex h-full">
              {/* 탭 영역 (위쪽) */}
              <div className="w-full">
                {/* 탭 헤더 */}
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedClassroom.classroomName || selectedClassroom.title}
                    </h2>
                  </div>
                  
                  {/* 탭 네비게이션 */}
                  <nav className="flex space-x-1">
                    {classroomTabs.map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setCurrentPage(tab.id)}
                          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === tab.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent size={16} className="mr-2" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* 탭 콘텐츠 */}
                <div className="h-full">
                  {currentPage === 'board' && (
                    <BoardPage
                      classroomId={selectedClassroom.classroomId || selectedClassroom.id}
                      currentUser={currentUser}
                      accessToken={accessToken}
                    />
                  )}
                  {currentPage === 'assignment' && (
                    <AssignmentPage
                      classroomId={selectedClassroom.classroomId || selectedClassroom.id}
                      currentUser={currentUser}
                      accessToken={accessToken}
                    />
                  )}
                  {currentPage === 'quiz' && (
                    <QuizPage
                      classroomId={selectedClassroom.classroomId || selectedClassroom.id}
                      currentUser={currentUser}
                      accessToken={accessToken}
                    />
                  )}
                  {currentPage === 'lesson' && (
                    <LessonPage
                      classroomId={selectedClassroom.classroomId || selectedClassroom.id}
                      currentUser={currentUser}
                      accessToken={accessToken}
                    />
                  )}
                  {currentPage === 'member' && (
                    <div className="p-8">
                      <h2 className="text-2xl font-bold mb-4">멤버 관리</h2>
                      <p className="text-gray-600">멤버 관리 기능은 준비 중입니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // 클래스룸 선택되지 않은 상태 - 홈 화면 (클래스룸 카드들 표시)
            <div className="p-6">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">내 클래스룸</h1>
                  <p className="text-gray-600">참여중인 클래스룸 목록입니다.</p>
                </div>

                {/* 클래스룸 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* 클래스룸 생성 카드 */}
                  <div className="bg-white rounded-xl border-2 border-dashed border-blue-300 p-6 hover:bg-blue-50 transition-colors cursor-pointer"
                       onClick={() => setShowCreateModal(true)}>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">➕</span>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">새 클래스룸</h3>
                      <p className="text-blue-600 text-sm">클래스룸을 생성하세요</p>
                    </div>
                  </div>

                  {/* 클래스룸 참여 카드 */}
                  <div className="bg-white rounded-xl border-2 border-dashed border-green-300 p-6 hover:bg-green-50 transition-colors cursor-pointer"
                       onClick={() => setShowJoinModal(true)}>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔗</span>
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">클래스룸 참여</h3>
                      <p className="text-green-600 text-sm">코드로 참여하세요</p>
                    </div>
                  </div>

                  {/* 실제 클래스룸 카드들 */}
                  {classrooms.map((classroom, index) => (
                    <div 
                      key={classroom.classroomId || classroom.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                      onClick={() => setSelectedClassroom(classroom)}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-white">📚</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {classroom.classroomName || classroom.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {classroom.description || '설명이 없습니다.'}
                        </p>
                        <div className="flex items-center justify-center text-xs text-gray-500">
                          <span>👥 멤버 {classroom.memberCount || 0}명</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 클래스룸이 없을 때 메시지 */}
                {classrooms.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">클래스룸이 없습니다</h2>
                    <p className="text-gray-600 mb-6">
                      새로운 클래스룸을 생성하거나<br />
                      기존 클래스룸에 참여해보세요.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        클래스룸 생성
                      </button>
                      <button
                        onClick={() => setShowJoinModal(true)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        클래스룸 참여
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 클래스룸 생성/참여 모달 */}
      {showCreateModal && <CreateClassroomModal />}
      {showJoinModal && <JoinClassroomModal />}
    </div>
  );
}

export default App;