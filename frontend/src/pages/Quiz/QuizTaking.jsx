import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import quizService from '../../services/quizService';

const QuizTaking = ({ classroomId, quiz, currentUser, accessToken, onBack, onComplete }) => {
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================================
  // 초기화 및 타이머
  // ============================================================================

  useEffect(() => {
    const startQuiz = async () => {
      try {
        setIsLoading(true);
        
        // 퀴즈 시작 요청
        await quizService.startQuiz(classroomId, quiz.quizId, currentUser.userId, accessToken);
        
        // 퀴즈 상세 정보 가져오기
        const quizDetail = await quizService.getQuiz(classroomId, quiz.quizId, currentUser.userId, accessToken);
        
        // options 필드를 JSON 파싱하여 배열로 변환
        const processedQuizData = {
          ...quizDetail,
          questions: quizDetail.questions.map(question => ({
            ...question,
            options: question.questionType === 'MULTIPLE_CHOICE' && question.options 
              ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options)
              : []
          }))
        };
        
        setQuizData(processedQuizData);
        
        // 답안 초기화
        const initialAnswers = {};
        processedQuizData.questions.forEach(q => {
          initialAnswers[q.questionId] = '';
        });
        setAnswers(initialAnswers);
        
        // 제한시간 설정
        if (processedQuizData.timeLimitMinutes) {
          setTimeRemaining(processedQuizData.timeLimitMinutes * 60); // 초 단위로 변환
        }
        
      } catch (error) {
        console.error('퀴즈 시작 실패:', error);
        setError('퀴즈를 시작할 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    startQuiz();
  }, [classroomId, quiz.quizId, currentUser.userId, accessToken]);

  // 타이머 효과
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 시간 종료 시 자동 제출
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const message = '페이지를 벗어나면 다시 응시할 수 없고 기록된 답안은 저장되지 않습니다. 정말 이동하시겠습니까?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ============================================================================
  // 이벤트 핸들러
  // ============================================================================

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleQuestionJump = (index) => {
    setCurrentQuestion(index);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // 답안 형식 변환
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: answer.toString()
      }));
      
      await quizService.submitQuiz(classroomId, quiz.quizId, formattedAnswers, accessToken, currentUser.userId);
      onComplete();
      
    } catch (error) {
      console.error('퀴즈 제출 실패:', error);
      alert('퀴즈 제출에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    setShowConfirmModal(true);
  };

  // ============================================================================
  // 유틸리티 함수
  // ============================================================================

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => answer && answer.toString().trim()).length;
  };

  const isQuestionAnswered = (questionId) => {
    const answer = answers[questionId];
    return answer && answer.toString().trim();
  };

  // ============================================================================
  // 렌더링 함수들
  // ============================================================================

  const renderQuestion = (question) => {
    const currentAnswer = answers[question.questionId] || '';

    return (
      <div className="space-y-6">
        {/* 문제 내용 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              문제 {currentQuestion + 1}
            </h3>
            <span className="text-sm text-gray-500">
              {question.points}점
            </span>
          </div>
          
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {question.questionText}
          </p>
        </div>

        {/* 답안 입력 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">답안</h4>
          
          {question.questionType === 'MULTIPLE_CHOICE' ? (
            <div className="space-y-3">
              {question.options && Array.isArray(question.options) ? (
                question.options.map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question_${question.questionId}`}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))
              ) : (
                <div className="text-red-500">선택지를 불러올 수 없습니다.</div>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="답을 입력하세요..."
            />
          )}
        </div>
      </div>
    );
  };

  const renderQuestionNavigation = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">문제 목록</h4>
      <div className="grid grid-cols-5 gap-2">
        {quizData.questions.map((question, index) => (
          <button
            key={question.questionId}
            onClick={() => handleQuestionJump(index)}
            className={`
              w-10 h-10 rounded-lg text-sm font-medium transition-colors
              ${currentQuestion === index 
                ? 'bg-blue-500 text-white' 
                : isQuestionAnswered(question.questionId)
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );

  const renderConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="text-yellow-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">퀴즈 제출 확인</h3>
        </div>
        
        <div className="space-y-3 mb-6">
          <p className="text-gray-700">
            정말로 퀴즈를 제출하시겠습니까?
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span>총 문제 수:</span>
              <span>{quizData.questions.length}개</span>
            </div>
            <div className="flex justify-between">
              <span>답변한 문제:</span>
              <span>{getAnsweredCount()}개</span>
            </div>
            <div className="flex justify-between">
              <span>미답변 문제:</span>
              <span className="text-red-600">
                {quizData.questions.length - getAnsweredCount()}개
              </span>
            </div>
          </div>
          <p className="text-sm text-red-600">
            제출 후에는 답안을 수정할 수 없습니다.
          </p>
        </div>
        
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => setShowConfirmModal(false)}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // 메인 렌더링
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">퀴즈를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return null;
  }

  const currentQ = quizData.questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quizData.title}</h1>
              {quizData.description && (
                <p className="text-gray-600 mt-1">{quizData.description}</p>
              )}
            </div>
          </div>
          
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <Clock size={20} className={timeRemaining <= 300 ? 'text-red-500' : 'text-blue-500'} />
              <span className={timeRemaining <= 300 ? 'text-red-500' : 'text-blue-500'}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>진행률</span>
            <span>{getAnsweredCount()} / {quizData.questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getAnsweredCount() / quizData.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-3 space-y-6">
          {renderQuestion(currentQ)}
          
          {/* 네비게이션 버튼 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전 문제
            </button>
            
            <span className="text-sm text-gray-500">
              {currentQuestion + 1} / {quizData.questions.length}
            </span>
            
            {currentQuestion < quizData.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                다음 문제
              </button>
            ) : (
              <button
                onClick={confirmSubmit}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                제출하기
              </button>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {renderQuestionNavigation()}
          
          {/* 퀴즈 정보 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">퀴즈 정보</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>총 문제:</span>
                <span>{quizData.totalQuestions}개</span>
              </div>
              <div className="flex justify-between">
                <span>총 점수:</span>
                <span>{quizData.totalPoints}점</span>
              </div>
              {quizData.timeLimitMinutes && (
                <div className="flex justify-between">
                  <span>제한시간:</span>
                  <span>{quizData.timeLimitMinutes}분</span>
                </div>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={confirmSubmit}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle size={16} />
            <span>퀴즈 제출</span>
          </button>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && renderConfirmModal()}
    </div>
  );
};

export default QuizTaking;