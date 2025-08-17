const quizSessionService = {
  baseURL: 'http://localhost:8080/api/quiz-sessions',

  // 인증 헤더 생성
  getAuthHeaders: (token) => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  }),

  // ============================================================================
  // 퀴즈 세션 관리
  // ============================================================================

  // 퀴즈 세션 시작
  startSession: async (quizId, studentId, token) => {
    const response = await fetch(
      `${quizSessionService.baseURL}/start?quizId=${quizId}&studentId=${studentId}`,
      {
        method: 'POST',
        headers: quizSessionService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('퀴즈 세션 시작 실패');
    }
    return response.json();
  },

  // 세션 진행 상태 변경
  markInProgress: async (sessionToken, token) => {
    const response = await fetch(
      `${quizSessionService.baseURL}/${sessionToken}/progress`,
      {
        method: 'POST',
        headers: quizSessionService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('세션 상태 변경 실패');
    }
    return response.json();
  },

  // 탭 이탈 기록
  recordTabSwitch: async (sessionToken, token) => {
    const response = await fetch(
      `${quizSessionService.baseURL}/${sessionToken}/tab-switch`,
      {
        method: 'POST',
        headers: quizSessionService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('탭 이탈 기록 실패');
    }
    return response.json();
  },

  // 위반 행위 기록
  recordViolation: async (sessionToken, violationType, token) => {
    const response = await fetch(
      `${quizSessionService.baseURL}/${sessionToken}/violation`,
      {
        method: 'POST',
        headers: quizSessionService.getAuthHeaders(token),
        body: JSON.stringify({ type: violationType }),
      }
    );
    
    if (!response.ok) {
      throw new Error('위반 기록 실패');
    }
    return response.json();
  },

  // 세션 완료
  completeSession: async (sessionToken, token) => {
    const response = await fetch(
      `${quizSessionService.baseURL}/${sessionToken}/complete`,
      {
        method: 'POST',
        headers: quizSessionService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('세션 완료 실패');
    }
    return response.json();
  },

  // 세션 강제 종료
  terminateSession: async (sessionToken, reason, token) => {
    const response = await fetch(
      `${quizSessionService.baseURL}/${sessionToken}/terminate`,
      {
        method: 'POST',
        headers: quizSessionService.getAuthHeaders(token),
        body: JSON.stringify({ reason }),
      }
    );
    
    if (!response.ok) {
      throw new Error('세션 종료 실패');
    }
    return response.json();
  },

  // 세션 상태 확인
  getSessionStatus: async (sessionToken, token) => {
    const response = await fetch(
      `${quizSessionService.baseURL}/${sessionToken}/status`,
      {
        method: 'GET',
        headers: quizSessionService.getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error('세션 상태 조회 실패');
    }
    return response.json();
  },

// 재응시 가능 여부 확인 - 향상된 에러 처리
canRetake: async (quizId, studentId, token) => {
  console.log('🔍 canRetake 호출 시작:', { 
    quizId, 
    studentId, 
    hasToken: !!token,
    tokenLength: token ? token.length : 0
  });
  
  if (!token) {
    throw new Error('인증 토큰이 없습니다. 로그인을 확인해주세요.');
  }
  
  try {
    const url = `${quizSessionService.baseURL}/can-retake?quizId=${quizId}&studentId=${studentId}`;
    console.log('📡 요청 URL:', url);
    
    const requestHeaders = quizSessionService.getAuthHeaders(token);
    console.log('📋 요청 헤더:', {
      'Content-Type': requestHeaders['Content-Type'],
      'Authorization': requestHeaders.Authorization ? 'Bearer [TOKEN]' : 'MISSING'
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    console.log('📥 응답 상태:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    // 응답 본문을 먼저 텍스트로 읽기
    const responseText = await response.text();
    console.log('📄 응답 본문 (텍스트):', responseText);

    if (!response.ok) {
      // 구체적인 HTTP 상태 코드별 에러 처리
      let errorMessage = '재응시 가능 여부 조회에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '해당 퀴즈에 접근할 권한이 없습니다.';
      } else if (response.status === 404) {
        errorMessage = '퀴즈를 찾을 수 없습니다.';
      } else if (response.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      // 서버에서 반환한 에러 메시지가 있으면 사용
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        console.warn('⚠️ 에러 응답 파싱 실패:', parseError);
      }

      console.error('❌ API 호출 실패:', {
        status: response.status,
        message: errorMessage,
        responseText: responseText
      });

      throw new Error(`${errorMessage} (HTTP ${response.status})`);
    }

    // 성공적인 응답 JSON 파싱
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ 파싱된 응답 데이터:', data);
    } catch (parseError) {
      console.error('❌ 성공 응답 JSON 파싱 실패:', parseError);
      throw new Error('서버 응답을 처리할 수 없습니다.');
    }

    // 응답 데이터 검증
    if (typeof data.canRetake !== 'boolean') {
      console.warn('⚠️ 예상하지 못한 응답 형식:', data);
      throw new Error('서버에서 유효하지 않은 응답을 받았습니다.');
    }

    console.log('🎉 canRetake 호출 성공:', {
      canRetake: data.canRetake,
      message: data.message
    });

    return data;
    
  } catch (error) {
    console.error('💥 canRetake 에러:', error);
    
    // 네트워크 에러인 경우
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('네트워크 연결을 확인해주세요. 서버에 접속할 수 없습니다.');
    }
    
    // 이미 처리된 에러는 그대로 throw
    if (error.message.includes('HTTP ')) {
      throw error;
    }
    
    // 기타 예상치 못한 에러
    throw new Error(`재응시 가능 여부 확인 중 오류가 발생했습니다: ${error.message}`);
  }
},

  // ============================================================================
  // 보안 관련 유틸리티
  // ============================================================================

  // 보안 위반 타입 정의
  VIOLATION_TYPES: {
    DEV_TOOLS: 'devTools',
    COPY_PASTE: 'copyPaste',
    CONTEXT_MENU: 'contextMenu',
    TAB_SWITCH: 'tabSwitch'
  },

  // 강화된 보안 모니터링 클래스
  SecurityMonitor: class {
    constructor(sessionToken, accessToken, callbacks = {}) {
      this.sessionToken = sessionToken;
      this.accessToken = accessToken;
      this.callbacks = callbacks;
      this.isActive = false;
      this.lastFocusTime = Date.now();
      this.violations = {
        tabSwitch: 0,
        devTools: 0,
        copyPaste: 0,
        contextMenu: 0,
        textSelection: 0,
        dragDrop: 0
      };

      // 바인드된 핸들러들
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleContextMenu = this.handleContextMenu.bind(this);
      this.handleSelectStart = this.handleSelectStart.bind(this);
      this.handleDragStart = this.handleDragStart.bind(this);
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleCopy = this.handleCopy.bind(this);
      this.handlePaste = this.handlePaste.bind(this);
      this.handleCut = this.handleCut.bind(this);
      this.handleBlur = this.handleBlur.bind(this);
      this.detectDevTools = this.detectDevTools.bind(this);
      this.handleResize = this.handleResize.bind(this);
      
      // 개발자 도구 감지용
      this.devToolsInterval = null;
      this.lastInnerHeight = window.innerHeight;
      this.lastInnerWidth = window.innerWidth;
    }

    // 모니터링 시작
    start() {
      if (this.isActive) return;
      
      this.isActive = true;
      
      // CSS 클래스 추가
      document.body.classList.add('quiz-security-mode');
      
      // 이벤트 리스너 등록 (capture phase에서 처리)
      document.addEventListener('visibilitychange', this.handleVisibilityChange, true);
      window.addEventListener('beforeunload', this.handleBeforeUnload, true);
      document.addEventListener('keydown', this.handleKeyDown, true);
      document.addEventListener('contextmenu', this.handleContextMenu, true);
      document.addEventListener('selectstart', this.handleSelectStart, true);
      document.addEventListener('dragstart', this.handleDragStart, true);
      document.addEventListener('mousedown', this.handleMouseDown, true);
      document.addEventListener('copy', this.handleCopy, true);
      document.addEventListener('paste', this.handlePaste, true);
      document.addEventListener('cut', this.handleCut, true);
      window.addEventListener('blur', this.handleBlur, true);
      window.addEventListener('resize', this.handleResize, true);
      window.addEventListener('focus', () => {
        // 포커스 복귀 시 개발자 도구 체크
        setTimeout(this.detectDevTools, 100);
      }, true);
      
      // 개발자 도구 감지 시작
      this.startDevToolsDetection();
      
      // 추가 보안 설정
      this.applySecurityStyles();
      
      console.log('🔒 Enhanced security monitoring started');
    }

    // 모니터링 중지
    stop() {
      if (!this.isActive) return;
      
      this.isActive = false;
      
      // CSS 클래스 제거
      document.body.classList.remove('quiz-security-mode');
      
      // 이벤트 리스너 제거
      document.removeEventListener('visibilitychange', this.handleVisibilityChange, true);
      window.removeEventListener('beforeunload', this.handleBeforeUnload, true);
      document.removeEventListener('keydown', this.handleKeyDown, true);
      document.removeEventListener('contextmenu', this.handleContextMenu, true);
      document.removeEventListener('selectstart', this.handleSelectStart, true);
      document.removeEventListener('dragstart', this.handleDragStart, true);
      document.removeEventListener('mousedown', this.handleMouseDown, true);
      document.removeEventListener('copy', this.handleCopy, true);
      document.removeEventListener('paste', this.handlePaste, true);
      document.removeEventListener('cut', this.handleCut, true);
      window.removeEventListener('blur', this.handleBlur, true);
      window.removeEventListener('resize', this.handleResize, true);

      // 개발자 도구 감지 중지
      this.stopDevToolsDetection();
      
      // 보안 스타일 복원
      this.removeSecurityStyles();
      
      console.log('🔓 Enhanced security monitoring stopped');
    }

    // 보안 스타일 적용
    applySecurityStyles() {
      const style = document.createElement('style');
      style.id = 'quiz-security-styles';
      style.textContent = `
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-user-drag: none !important;
          -moz-user-drag: none !important;
          user-drag: none !important;
          -webkit-touch-callout: none !important;
        }
        input, textarea, [contenteditable="true"] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `;
      document.head.appendChild(style);
    }

    // 보안 스타일 제거
    removeSecurityStyles() {
      const style = document.getElementById('quiz-security-styles');
      if (style) {
        style.remove();
      }
    }

    // 개발자 도구 감지 시작
    startDevToolsDetection() {
      // 여러 방법으로 개발자 도구 감지
      this.devToolsInterval = setInterval(() => {
        this.detectDevTools();
      }, 1000);
    }

    // 개발자 도구 감지 중지
    stopDevToolsDetection() {
      if (this.devToolsInterval) {
        clearInterval(this.devToolsInterval);
        this.devToolsInterval = null;
      }
    }

    // 개발자 도구 감지
    detectDevTools() {
      // 방법 1: 콘솔 객체 감지
      let devtools = {open: false, orientation: null};
      
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
          if (!devtools.open) {
            devtools.open = true;
            this.handleDevToolsOpen();
          }
        } else {
          devtools.open = false;
        }
      }, 500);

      // 방법 2: 화면 크기 변화 감지
      const threshold = 100;
      if (Math.abs(window.innerHeight - this.lastInnerHeight) > threshold ||
          Math.abs(window.innerWidth - this.lastInnerWidth) > threshold) {
        this.handleDevToolsOpen();
      }

      this.lastInnerHeight = window.innerHeight;
      this.lastInnerWidth = window.innerWidth;
    }

    // 개발자 도구 열림 감지 시 처리
    async handleDevToolsOpen() {
      await this.recordViolation('devTools', '개발자 도구 사용 감지');
    }

    // 화면 크기 변화 감지
    handleResize() {
      if (!this.isActive) return;
      setTimeout(this.detectDevTools, 100);
    }

    // 키보드 이벤트 처리 (강화된 버전)
    async handleKeyDown(e) {
      if (!this.isActive) return;

      const key = e.key.toLowerCase();
      const keyCode = e.keyCode || e.which;
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 복사/붙여넣기/잘라내기/전체선택 방지
      if (isCtrlOrCmd && (
        key === 'c' || keyCode === 67 ||
        key === 'v' || keyCode === 86 ||
        key === 'x' || keyCode === 88 ||
        key === 'a' || keyCode === 65 ||
        key === 's' || keyCode === 83 ||
        key === 'p' || keyCode === 80
      )) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        await this.recordViolation('copyPaste', '복사/붙여넣기 시도');
        return false;
      }

      // 새로고침 방지
      if (key === 'f5' || keyCode === 116 || 
          (isCtrlOrCmd && (key === 'r' || keyCode === 82))) {
        e.preventDefault();
        e.stopPropagation();
        this.callbacks.onWarning?.('새로고침은 금지되어 있습니다.');
        return false;
      }

      // 개발자 도구 단축키 방지
      if (key === 'f12' || keyCode === 123 ||
          (isCtrlOrCmd && e.shiftKey && (key === 'i' || keyCode === 73)) ||
          (isCtrlOrCmd && e.shiftKey && (key === 'j' || keyCode === 74)) ||
          (isCtrlOrCmd && e.shiftKey && (key === 'c' || keyCode === 67)) ||
          (isCtrlOrCmd && (key === 'u' || keyCode === 85))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        await this.recordViolation('devTools', '개발자 도구 단축키 시도');
        return false;
      }
    }

    // 텍스트 선택 방지
    async handleSelectStart(e) {
      if (!this.isActive) return;
      
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
          target.contentEditable === 'true' || target.isContentEditable) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      await this.recordViolation('textSelection', '텍스트 선택 시도');
      return false;
    }

    // 드래그 시작 방지
    async handleDragStart(e) {
      if (!this.isActive) return;
      
      e.preventDefault();
      e.stopPropagation();
      await this.recordViolation('dragDrop', '드래그 시도');
      return false;
    }

    // 마우스 드래그 방지
    async handleMouseDown(e) {
      if (!this.isActive) return;
      
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
    }

    // 복사 이벤트 차단
    async handleCopy(e) {
      if (!this.isActive) return;
      
      e.preventDefault();
      e.stopPropagation();
      e.clipboardData.setData('text/plain', '');
      await this.recordViolation('copyPaste', '복사 시도');
      return false;
    }

    // 붙여넣기 이벤트 차단
    async handlePaste(e) {
      if (!this.isActive) return;
      
      const target = e.target;
      // 퀴즈 응답 입력 필드는 선택적으로 허용 가능
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // 필요에 따라 주석 해제하여 입력 필드에서 붙여넣기 허용
        // return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      await this.recordViolation('copyPaste', '붙여넣기 시도');
      return false;
    }

    // 잘라내기 이벤트 차단
    async handleCut(e) {
      if (!this.isActive) return;
      
      e.preventDefault();
      e.stopPropagation();
      e.clipboardData.setData('text/plain', '');
      await this.recordViolation('copyPaste', '잘라내기 시도');
      return false;
    }

    // 우클릭 방지
    async handleContextMenu(e) {
      if (!this.isActive) return;
      
      e.preventDefault();
      e.stopPropagation();
      await this.recordViolation('contextMenu', '우클릭 시도');
      return false;
    }

    // 탭 변경 감지
    async handleVisibilityChange() {
      if (!this.isActive) return;
      
      if (document.hidden) {
        this.lastFocusTime = Date.now();
      } else {
        const awayTime = Date.now() - this.lastFocusTime;
        if (awayTime > 1000) {
          try {
            const result = await quizSessionService.recordTabSwitch(this.sessionToken, this.accessToken);
            
            if (result.terminated) {
              this.handleTermination('탭 이탈 기준 초과');
            } else {
              this.violations.tabSwitch = result.warningCount;
              this.callbacks.onWarning?.(result.message);
            }
          } catch (error) {
            console.error('탭 이탈 기록 실패:', error);
          }
        }
      }
    }

    // 창 포커스 잃음 감지
    async handleBlur() {
      if (!this.isActive) return;
      
      // 개발자 도구가 열렸을 가능성이 있으므로 체크
      setTimeout(this.detectDevTools, 100);
    }

    // 페이지 언로드 방지
    handleBeforeUnload(e) {
      if (!this.isActive) return;
  
      const message = '페이지를 벗어나면 다시 응시할 수 없고 기록된 답안은 저장되지 않습니다. 정말 이동하시겠습니까?';
  
      e.preventDefault();
      e.returnValue = message;
      return message;
    }

    // 위반 기록
    async recordViolation(type, message) {
      try {
        const result = await quizSessionService.recordViolation(this.sessionToken, type, this.accessToken);
        
        if (result.terminated) {
          this.handleTermination(message);
        } else {
          this.violations[type] = result.violationCount;
          this.callbacks.onWarning?.(result.message || message);
        }
      } catch (error) {
        console.error('위반 기록 실패:', error);
        this.callbacks.onWarning?.(message);
      }
    }

    // 세션 종료 처리
    handleTermination(reason) {
      this.stop();
      this.callbacks.onTermination?.(reason);
    }

    // 위반 상태 조회
    getViolations() {
      return { ...this.violations };
    }

    // 보안 상태 확인
    getSecurityStatus() {
      return {
        isActive: this.isActive,
        violations: this.getViolations(),
        totalViolations: Object.values(this.violations).reduce((sum, count) => sum + count, 0)
      };
    }
  }
};

export default quizSessionService;