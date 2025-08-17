import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Clock, AlertCircle, CheckCircle, Shield, XCircle, AlertTriangle } from 'lucide-react';
import quizService from '../../services/quizService';

const QuizTakingSecurity = ({ classroomId, quiz, currentUser, accessToken, onBack, onComplete }) => {
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);
  
  // 보안 관련 상태
  const [sessionToken, setSessionToken] = useState(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [securityWarnings, setSecurityWarnings] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // 보안 모니터링 관련 ref
  const lastFocusTime = useRef(Date.now());
  const isSubmittingRef = useRef(false);
  const sessionTokenRef = useRef(null);
  const isMonitoringRef = useRef(false);

  // ============================================================================
  // 보안 관련 함수들 - 순서 중요! (이벤트 핸들러들을 먼저 정의)
  // ============================================================================

  // 보안 경고 메시지 추가
  const addSecurityWarning = useCallback((message) => {
    const id = Date.now();
    
    setSecurityWarnings(prev => [...prev.slice(-4), {
      id,
      message,
      timestamp: new Date()
    }]);
  
    // 5초 후 자동 제거
    setTimeout(() => {
      setSecurityWarnings(prev => prev.filter(warning => warning.id !== id));
    }, 5000);
  }, []);

  // 세션 강제 종료 처리
  const handleSessionTerminated = useCallback((message) => {
    alert(`퀴즈가 강제 종료되었습니다.\n\n사유: ${message}`);
    setIsMonitoring(false);
    onBack();
  }, [onBack]);

  // API 호출 함수들
  const recordViolation = async (type, sessionToken) => {
    if (!sessionToken || isSubmittingRef.current) return;
    
    try {
      const response = await fetch(`${quizService.baseURL.replace('/api', '/api/quiz-sessions')}/${sessionToken}/violation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ type })
      });
      
      const result = await response.json();
      if (result.terminated) {
        handleSessionTerminated(result.message);
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('위반 기록 실패:', error);
      return true;
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((e) => {
    if (!isMonitoringRef.current || isSubmittingRef.current) return;

    const key = e.key.toLowerCase();
    const keyCode = e.keyCode || e.which;
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    // 복사/붙여넣기/잘라내기/전체선택 방지
    if (isCtrlOrCmd && (
      key === 'c' || keyCode === 67 || // 복사
      key === 'v' || keyCode === 86 || // 붙여넣기
      key === 'x' || keyCode === 88 || // 잘라내기
      key === 'a' || keyCode === 65 || // 전체선택
      key === 's' || keyCode === 83 || // 저장
      key === 'p' || keyCode === 80 || // 인쇄
      key === 'z' || keyCode === 90 || // 실행취소
      key === 'y' || keyCode === 89    // 다시실행
    )) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      recordViolation('copyPaste', sessionTokenRef.current);
      return false;
    }

    // 새로고침 방지
    if (key === 'f5' || keyCode === 116 || 
        (isCtrlOrCmd && (key === 'r' || keyCode === 82))) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // 개발자 도구 단축키 방지
    if (key === 'f12' || keyCode === 123 || // F12
        (isCtrlOrCmd && e.shiftKey && (key === 'i' || keyCode === 73)) || // Ctrl+Shift+I
        (isCtrlOrCmd && e.shiftKey && (key === 'j' || keyCode === 74)) || // Ctrl+Shift+J
        (isCtrlOrCmd && e.shiftKey && (key === 'c' || keyCode === 67)) || // Ctrl+Shift+C
        (isCtrlOrCmd && (key === 'u' || keyCode === 85))) { // Ctrl+U
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, [addSecurityWarning]);

  // 우클릭 방지
  const handleContextMenu = useCallback((e) => {
    if (!isMonitoringRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    recordViolation('contextMenu', sessionTokenRef.current);
    return false;
  }, []);

  // 텍스트 선택 방지
  const handleSelectStart = useCallback((e) => {
    if (!isMonitoringRef.current) return;
    
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' || target.isContentEditable) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // 드래그 시작 방지
  const handleDragStart = useCallback((e) => {
    if (!isMonitoringRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // 마우스 드래그 방지
  const handleMouseDown = useCallback((e) => {
    if (!isMonitoringRef.current) return;
    
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' || target.isContentEditable ||
        target.tagName === 'BUTTON' || target.role === 'button' ||
        target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    if (e.detail > 1) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, []);

  // 복사 이벤트 차단
  const handleCopy = useCallback((e) => {
    if (!isMonitoringRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.clipboardData?.setData('text/plain', '');
    recordViolation('copyPaste', sessionTokenRef.current);
    return false;
  }, []);

  // 붙여넣기 이벤트 차단
  const handlePaste = useCallback((e) => {
    if (!isMonitoringRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    recordViolation('copyPaste', sessionTokenRef.current);
    return false;
  }, []);

  // 잘라내기 이벤트 차단
  const handleCut = useCallback((e) => {
    if (!isMonitoringRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.clipboardData?.setData('text/plain', '');
    recordViolation('copyPaste', sessionTokenRef.current);
    return false;
  }, []);

  // 페이지 언로드 방지
  const handleBeforeUnload = useCallback((e) => {
    if (!isMonitoring || isSubmittingRef.current) return;
  
    const message = '페이지를 벗어나면 다시 응시할 수 없고 기록된 답안은 저장되지 않습니다. 정말 이동하시겠습니까?';
  
    e.preventDefault();
    e.returnValue = message;
    return message;
  }, [isMonitoring]);

   // 보안 모니터링 시작
  const startSecurityMonitoring = useCallback(() => {
      if (isSubmittingRef.current || isMonitoringRef.current) return;

      isMonitoringRef.current = true;
      setIsMonitoring(true);

      console.log('🔒 보안 모니터링 시작')

      // 네비게이션 차단 핸들러 (가장 중요!)
      const handleNavigationClick = (e) => {
        if (!isMonitoringRef.current || isSubmittingRef.current) return;

        const target = e.target;
        const clickedElement = target.closest('button, a, [role="button"], [onClick]');
     
        if (!clickedElement) return;

        // 퀴즈 컨테이너 내부인지 확인
        const quizContainer = document.querySelector('.max-w-4xl');
        const isInsideQuiz = quizContainer && quizContainer.contains(clickedElement);
     
        if (isInsideQuiz) {
            // 퀴즈 내부 버튼은 허용
            return;
        }

        // 외부 네비게이션 버튼 감지
        const isNavigation = 
            clickedElement.closest('nav, .sidebar, header') ||
            clickedElement.textContent?.includes('홈') ||
            clickedElement.textContent?.includes('일정') ||
            clickedElement.textContent?.includes('설정') ||
            clickedElement.textContent?.includes('게시판') ||
            clickedElement.textContent?.includes('과제') ||
            clickedElement.textContent?.includes('수업') ||
            clickedElement.textContent?.includes('멤버') ||
            clickedElement.href ||
            clickedElement.tagName === 'A';

        if (isNavigation) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const confirmed = window.confirm(
                '퀴즈 응시 중입니다.\n\n페이지를 이동하면 현재 답안이 저장되지 않고 퀴즈가 종료됩니다.\n\n정말로 이동하시겠습니까?'
            );

            if (confirmed) {
                console.log('🚪 사용자 확인 - 페이지 이동 시작');
             
                // 보안 해제
                isMonitoringRef.current = false;
                setIsMonitoring(false);
             
                // 정리
                if (window.quizCleanupHandlers) {
                    window.quizCleanupHandlers();
                }

                // React Router 방식으로 강제 이동
                setTimeout(() => {
                    // 방법 1: onBack 호출해서 상위 컴포넌트로 돌아가기
                    if (clickedElement.textContent?.includes('과제')) {
                        console.log('🔄 과제 페이지로 이동 - onBack 호출');
                        onBack(); // 퀴즈에서 나가서 원래 페이지로
                        return;
                    }
                 
                    // 방법 2: 강제로 페이지 새로고침 (React Router 우회)
                    if (clickedElement.href) {
                        console.log('🌐 강제 새로고침으로 이동:', clickedElement.href);
                        window.location.reload();
                        window.location.href = clickedElement.href;
                        return;
                    }
                 
                    // 방법 3: React Router의 history API 직접 조작
                    if (window.history && window.history.pushState) {
                        console.log('🔄 History API로 강제 이동');
                        window.history.pushState({}, '', '/classroom/' + classroomId);
                        window.location.reload();
                        return;
                    }
                 
                    // 방법 4: 최후의 수단 - 강제 새로고침
                    console.log('🔄 마지막 방법 - 강제 새로고침');
                    window.location.reload();
                 
                }, 100);
            } else {
                console.log('❌ 사용자 취소 - 퀴즈 계속');
            }

            return false;
        }
    };
 
      // 키보드 이벤트 핸들러
      const handleKeyDown = (e) => {
          if (!isMonitoringRef.current || isSubmittingRef.current) return;
 
          const key = e.key.toLowerCase();
          const isCtrlOrCmd = e.ctrlKey || e.metaKey;
 
          // 복사/붙여넣기 방지
          if (isCtrlOrCmd && ['c', 'v', 'x', 'a', 's', 'p'].includes(key)) {
              e.preventDefault();
              e.stopPropagation();
              addSecurityWarning('복사/붙여넣기는 금지되어 있습니다.');
              recordViolation('copyPaste', sessionTokenRef.current);
              return false;
          }
 
          // 새로고침 방지
          if (key === 'f5' || (isCtrlOrCmd && key === 'r')) {
              e.preventDefault();
              e.stopPropagation();
              addSecurityWarning('새로고침은 금지되어 있습니다.');
              return false;
          }
 
          // 개발자 도구 방지
          if (key === 'f12' || 
              (isCtrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
              (isCtrlOrCmd && key === 'u')) {
              e.preventDefault();
              e.stopPropagation();
              addSecurityWarning('개발자 도구 사용은 금지되어 있습니다.');
              return false;
          }
 
          // 뒤로가기 방지
          if (e.altKey && key === 'arrowleft') {
              e.preventDefault();
              e.stopPropagation();
              addSecurityWarning('브라우저 뒤로가기는 금지되어 있습니다.');
              return false;
          }
      };
 
      // 우클릭 방지
      const handleContextMenu = (e) => {
          if (!isMonitoringRef.current) return;
          e.preventDefault();
          addSecurityWarning('우클릭은 금지되어 있습니다.');
          recordViolation('contextMenu', sessionTokenRef.current);
          return false;
      };
 
      // 텍스트 선택 방지
      const handleSelectStart = (e) => {
          if (!isMonitoringRef.current) return;
          const target = e.target;
          if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.contentEditable === 'true') {
              return;
          }
          e.preventDefault();
          return false;
      };
 
      // 페이지 이탈 방지
      const handleBeforeUnload = (e) => {
          if (!isMonitoringRef.current || isSubmittingRef.current) return;
          const message = '퀴즈 응시 중입니다. 페이지를 벗어나면 답안이 저장되지 않습니다.';
          e.preventDefault();
          e.returnValue = message;
          return message;
      };
 
      // 탭 전환 감지
      const handleVisibilityChange = () => {
          if (!isMonitoringRef.current || isSubmittingRef.current) return;
          if (document.hidden) {
              addSecurityWarning('탭 전환이 감지되었습니다. 퀴즈에 집중해주세요.');
              recordViolation('tabSwitch', sessionTokenRef.current);
          }
      };

      // 이벤트 리스너 등록 (capture: true로 최우선 처리)
      document.addEventListener('click', handleNavigationClick, true);
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('contextmenu', handleContextMenu, true);
      document.addEventListener('selectstart', handleSelectStart, true);
      document.addEventListener('visibilitychange', handleVisibilityChange, true);
      window.addEventListener('beforeunload', handleBeforeUnload, true);
 
      // CSS 보안 스타일 적용
      const style = document.createElement('style');
      style.id = 'quiz-security-styles';
      style.textContent = `
          body {
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
          }
          input, textarea, [contenteditable="true"] {
              user-select: text !important;
              -webkit-user-select: text !important;
          }
      `;
      document.head.appendChild(style);

      // 정리 함수를 window에 저장
      window.quizCleanupHandlers = () => {
          document.removeEventListener('click', handleNavigationClick, true);
          document.removeEventListener('keydown', handleKeyDown, true);
          document.removeEventListener('contextmenu', handleContextMenu, true);
          document.removeEventListener('selectstart', handleSelectStart, true);
          document.removeEventListener('visibilitychange', handleVisibilityChange, true);
          window.removeEventListener('beforeunload', handleBeforeUnload, true);
          
          const styleElement = document.getElementById('quiz-security-styles');
          if (styleElement) {
              styleElement.remove();
          }
          
          delete window.quizCleanupHandlers;
      };
 
  }, [addSecurityWarning, recordViolation]);

  // stopSecurityMonitoring 함수도 교체
  const stopSecurityMonitoring = useCallback(() => {
      if (!isMonitoringRef.current) return;
 
      isMonitoringRef.current = false;
      setIsMonitoring(false);
 
      console.log('🔓 보안 모니터링 중지');
 
      if (window.quizCleanupHandlers) {
          window.quizCleanupHandlers();
      }
 
  }, []);

  // 컴포넌트 언마운트 시 정리 useEffect도 교체
  useEffect(() => {
      return () => {
          if (window.quizCleanupHandlers) {
              console.log('🧹 컴포넌트 언마운트 - 보안 정리');
              window.quizCleanupHandlers();
          }
      };
  }, []);

  // 뒤로가기 버튼 핸들러 추가 (기존 onBack을 이걸로 교체)
  const handleBackButton = useCallback(() => {
      if (!isMonitoring) {
          onBack();
          return;
      }
 
      const confirmed = window.confirm(
          '퀴즈 응시를 중단하시겠습니까?\n\n현재까지의 답안은 저장되지 않습니다.'
      );
 
      if (confirmed) {
          stopSecurityMonitoring();
          onBack();
      }
  }, [isMonitoring, onBack, stopSecurityMonitoring]);

  // ============================================================================
  // 퀴즈 시작 및 API 함수들
  // ============================================================================

  const startQuizSession = async () => {
    try {
      const response = await fetch(`${quizService.baseURL.replace('/api', '/api/quiz-sessions/start')}?quizId=${quiz.quizId}&studentId=${currentUser.userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        return result.sessionToken;
      } else {
        throw new Error(result.message || '세션 시작 실패');
      }
    } catch (error) {
      console.error('세션 시작 실패:', error);
      throw error;
    }
  };

  const completeSession = async (sessionToken) => {
    if (!sessionToken) return;
    
    try {
      await fetch(`${quizService.baseURL.replace('/api', '/api/quiz-sessions')}/${sessionToken}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      console.error('세션 완료 실패:', error);
    }
  };

  const startQuiz = async () => {
    try {
      setIsLoading(true);
      
      // 세션 시작
      const token = await startQuizSession();
      setSessionToken(token);
      sessionTokenRef.current = token;
      
      // 퀴즈 데이터 로드
      const quizDetail = await quizService.getQuiz(classroomId, quiz.quizId, currentUser.userId, accessToken);
      
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
        setTimeRemaining(processedQuizData.timeLimitMinutes * 60);
      }
      
      // 보안 모니터링 시작
      startSecurityMonitoring();
      
      // 시작 모달 닫기
      setShowStartModal(false);
      
    } catch (error) {
      console.error('퀴즈 시작 실패:', error);
      setError(error.message || '퀴즈를 시작할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // 퀴즈 답안 및 제출 핸들러
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
    isSubmittingRef.current = true;
      setIsSubmitting(true);
    
      // 보안 모니터링 중지
      stopSecurityMonitoring();
    
      // 답안 형식 변환
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: answer.toString()
      }));
    
      // 퀴즈 제출
      await quizService.submitQuiz(classroomId, quiz.quizId, formattedAnswers, accessToken, currentUser.userId);
    
      // 세션 완료
      if (sessionTokenRef.current) {
        await completeSession(sessionTokenRef.current);
      }
    
      // 완료 콜백 호출 - quizId 전달
      if (onComplete) {
        onComplete(quiz.quizId); // 파라미터 전달
      } else {
        onBack();
      }
    
    } catch (error) {
      console.error('퀴즈 제출 실패:', error);
      alert('퀴즈 제출에 실패했습니다.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      startSecurityMonitoring(); // 모니터링 재시작
    }
  };

  const confirmSubmit = () => {
    setShowConfirmModal(true);
  };

  // ============================================================================
  // Effects
  // ============================================================================

  // 타이머 효과
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 실제 언마운트일 때만 정리
      if (isSubmittingRef.current) return; // 제출 중이면 정리하지 않음
    
      console.log('🧹 컴포넌트 언마운트 - 정리 시작');
    
      // 보안 모니터링이 활성화된 경우에만 정리
      if (isMonitoringRef.current) {
        // 이벤트 리스너 제거
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('contextmenu', handleContextMenu, true);
        document.removeEventListener('selectstart', handleSelectStart, true);
        document.removeEventListener('dragstart', handleDragStart, true);
        document.removeEventListener('mousedown', handleMouseDown, true);
        document.removeEventListener('copy', handleCopy, true);
        document.removeEventListener('paste', handlePaste, true);
        document.removeEventListener('cut', handleCut, true);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      
        // CSS 스타일 복원
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.mozUserSelect = '';
        document.body.style.msUserSelect = '';
        document.body.style.webkitTouchCallout = '';
        document.body.style.webkitUserDrag = '';
        document.body.style.khtmlUserSelect = '';
        document.body.style.contextMenu = '';
      }
    
      // 세션 완료
      if (sessionTokenRef.current) {
        completeSession(sessionTokenRef.current);
      }
    };
  }, []);

  // ============================================================================
  // 유틸리티 함수들
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

  // 퀴즈 시작 전 안내 모달
  const renderStartModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="text-blue-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">퀴즈 응시 안내</h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <AlertCircle className="text-yellow-400" size={20} />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">중요 안내사항</h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>퀴즈는 <strong>1회만 응시</strong> 가능합니다</li>
                    <li>복사/붙여넣기가 금지됩니다</li>
                    <li>우클릭이 비활성화됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <Clock className="text-blue-400" size={20} />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">퀴즈 정보</h4>
                <div className="mt-2 text-sm text-blue-700">
                  <p>제한시간: {quiz.timeLimitMinutes || '무제한'}분</p>
                  <p>문제 수: {quiz.totalQuestions}개</p>
                  <p>총점: {quiz.totalPoints}점</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={startQuiz}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '시작 중...' : '퀴즈 시작'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestion = (question) => {
    const currentAnswer = answers[question.questionId] || '';

    return (
      <div className="space-y-6">
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

  // 시작 모달 표시
  if (showStartModal) {
    return renderStartModal();
  }

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
      {/* 보안 경고 표시 */}
      {securityWarnings.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {securityWarnings.slice(-3).map((warning) => (
            <div
              key={warning.id}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm"
            >
              <div className="flex items-center">
                <AlertTriangle size={16} className="mr-2" />
                <span className="text-sm">{warning.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              disabled={isMonitoring}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isMonitoring ? "퀴즈 진행 중에는 나갈 수 없습니다" : "뒤로가기"}
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
          
          <div className="flex items-center space-x-4">
            {isMonitoring && (
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="text-green-500" size={16} />
                <span className="text-green-500">모니터링 중</span>
              </div>
            )}
            
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 text-lg font-semibold">
                <Clock size={20} className={timeRemaining <= 300 ? 'text-red-500' : 'text-blue-500'} />
                <span className={timeRemaining <= 300 ? 'text-red-500' : 'text-blue-500'}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
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

export default QuizTakingSecurity;