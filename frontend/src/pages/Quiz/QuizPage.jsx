import React, { useState, useEffect } from 'react';
import { Plus, Clock, Users, BarChart3, PlayCircle, Edit, Trash2, FileText, AlertTriangle } from 'lucide-react';
import quizService from '../../services/quizService';
import quizSessionService from '../../services/quizSessionService';
import QuizForm from './QuizForm';
import QuizTakingSecurity from './QuizTakingSecurity'; // 보안 강화된 컴포넌트
import QuizResult from './QuizResult';

const QuizPage = ({ classroomId, currentUser, accessToken }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // list, create, edit, take, result
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [error, setError] = useState(null);

  const isEducator = currentUser?.userType === 'EDUCATOR';

  // 데이터 로딩
  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await quizService.getQuizzes(classroomId, currentUser.userId, accessToken);
      setQuizzes(data);
    } catch (error) {
      console.error('퀴즈 목록 로딩 실패:', error);
      setError('퀴즈 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshQuizStatus = async (quizId) => {
    try {
      const status = await quizService.getQuizStatus(classroomId, quizId, currentUser.userId, accessToken);
      setQuizzes(prev =>
        prev.map(q =>
          q.quizId === quizId
            ? { ...q, hasSubmitted: status.hasSubmitted, status: status.status }
            : q
        )
      );
    } catch (error) {
      console.error('퀴즈 상태 업데이트 실패:', error);
    }
  };

  useEffect(() => {
    if (classroomId && currentUser) loadQuizzes();
  }, [classroomId, currentUser]);

  // 이벤트 핸들러
  const handleCreateQuiz = () => {
    setSelectedQuiz(null);
    setActiveView('create');
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setActiveView('edit');
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('정말로 이 퀴즈를 삭제하시겠습니까?')) return;
    try {
      await quizService.deleteQuiz(classroomId, quizId, accessToken, currentUser.userId);
      await loadQuizzes();
    } catch (error) {
      console.error('퀴즈 삭제 실패:', error);
      alert('퀴즈 삭제에 실패했습니다.');
    }
  };

  const handleTakeQuiz = async (quiz) => {
    if (!accessToken) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }
    if (!currentUser || !currentUser.userId) {
      alert('사용자 정보를 확인할 수 없습니다.');
      return;
    }

    const status = quizService.getQuizStatus(quiz);
    if (status !== 'ACTIVE') {
      let message = status === 'SCHEDULED'
        ? '퀴즈가 아직 시작되지 않았습니다.'
        : '퀴즈가 이미 종료되었습니다.';
      alert(message);
      return;
    }

    if (quiz.hasSubmitted) {
      alert('이미 응시한 퀴즈입니다. 결과를 확인해주세요.');
      return;
    }

    setSelectedQuiz(quiz);
    setActiveView('take');
  };

  const handleViewResult = (quiz) => {
    setSelectedQuiz(quiz);
    setActiveView('result');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedQuiz(null);
    loadQuizzes();
  };

  const handleQuizComplete = (quizId) => {
    refreshQuizStatus(quizId);
    setActiveView('list');
    setSelectedQuiz(null);
  };

  // 렌더링 함수
  const getQuizStatusBadge = (quiz) => {
    const status = quizService.getQuizStatus(quiz);
    const styles = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      ENDED: 'bg-gray-100 text-gray-800'
    };
    const labels = { SCHEDULED: '예정', ACTIVE: '진행중', ENDED: '종료' };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const renderQuizCard = (quiz) => {
    const status = quizService.getQuizStatus(quiz);
    const canTake = status === 'ACTIVE' && !quiz.hasSubmitted;
    const canEdit = isEducator && status === 'SCHEDULED';

    return (
      <div
        key={quiz.quizId}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
              {getQuizStatusBadge(quiz)}
              {!isEducator && quiz.hasSubmitted && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  제출완료
                </span>
              )}
            </div>
            {quiz.description && (
              <p className="text-gray-600 text-sm">{quiz.description}</p>
            )}
          </div>

          {isEducator && (
            <div className="flex items-center space-x-2 ml-4">
              {canEdit && (
                <button
                  onClick={() => handleEditQuiz(quiz)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition"
                  title="수정"
                >
                  <Edit size={18} />
                </button>
              )}
              <button
                onClick={() => handleDeleteQuiz(quiz.quizId)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition"
                title="삭제"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Clock size={16} />
            <span>시작: {formatDateTime(quiz.startTime)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={16} />
            <span>종료: {formatDateTime(quiz.endTime)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText size={16} />
            <span>문제 {quiz.totalQuestions}개</span>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 size={16} />
            <span>총 {quiz.totalPoints}점</span>
          </div>
          {quiz.timeLimitMinutes && (
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>제한시간: {quiz.timeLimitMinutes}분</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Users size={16} />
            <span>참여자 {quiz.participantCount}명</span>
          </div>
        </div>

        {/* 보안 안내 */}
        {!isEducator && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">퀴즈 응시 안내</p>
                <p className="text-xs mt-1">1회 응시 제한, 복사/붙여넣기 및 우클릭 방지</p>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {quiz.creatorName} • {formatDateTime(quiz.createdAt)}
          </span>

          <div className="flex items-center space-x-2">
            {isEducator ? (
              <button
                onClick={() => handleViewResult(quiz)}
                className="px-5 py-2.5 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
              >
                결과 보기
              </button>
            ) : (
              <>
                {canTake ? (
                  <button
                    onClick={() => handleTakeQuiz(quiz)}
                    className="px-5 py-2.5 text-sm bg-green-500 text-white rounded-xl hover:bg-green-600 transition flex items-center space-x-2"
                  >
                    <PlayCircle size={18} />
                    <span>응시하기</span>
                  </button>
                ) : quiz.hasSubmitted ? (
                  <button
                    onClick={() => handleViewResult(quiz)}
                    className="px-5 py-2.5 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
                  >
                    결과 보기
                  </button>
                ) : (
                  <span className="px-4 py-2 text-sm text-gray-500">
                    {status === 'SCHEDULED' ? '대기중' : '종료됨'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuizList = () => (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-extrabold text-gray-900">퀴즈</h2>

        {isEducator && (
          <button
            onClick={handleCreateQuiz}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600 transition"
          >
            <Plus size={20} />
            <span>퀴즈 생성</span>
          </button>
        )}
      </div>

      {/* 퀴즈 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">퀴즈 목록을 불러오는 중...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText size={56} className="mb-4 text-gray-400" />
          <p className="text-lg mb-2">아직 퀴즈가 없습니다</p>
          {isEducator && <p className="text-sm">첫 번째 퀴즈를 생성해보세요!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map(renderQuizCard)}
        </div>
      )}
    </div>
  );


  // 메인 렌더링
  switch (activeView) {
    case 'create':
      return (
        <QuizForm
          classroomId={classroomId}
          currentUser={currentUser}
          accessToken={accessToken}
          onBack={handleBackToList}
          onSave={handleBackToList}
        />
      );

    case 'edit':
      return (
        <QuizForm
          classroomId={classroomId}
          currentUser={currentUser}
          accessToken={accessToken}
          quiz={selectedQuiz}
          onBack={handleBackToList}
          onSave={handleBackToList}
        />
      );

    case 'take':
      return (
        <QuizTakingSecurity
          classroomId={classroomId}
          quiz={selectedQuiz}
          currentUser={currentUser}
          accessToken={accessToken}
          onBack={handleBackToList}
          onComplete={handleQuizComplete}
        />
      );

    case 'result':
      return (
        <QuizResult
          classroomId={classroomId}
          quiz={selectedQuiz}
          currentUser={currentUser}
          accessToken={accessToken}
          isEducator={isEducator}
          onBack={handleBackToList}
        />
      );

    default:
      return renderQuizList();
  }
};

export default QuizPage;