import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import quizService from '../../services/quizService';

const QuizForm = ({ classroomId, currentUser, accessToken, quiz, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    timeLimitMinutes: '',
    questions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = !!quiz;

  // ============================================================================
  // 초기화
  // ============================================================================

  useEffect(() => {
    if (quiz) {
      // 수정 모드일 때 기존 데이터 설정
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        startTime: quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '',
        endTime: quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '',
        timeLimitMinutes: quiz.timeLimitMinutes || '',
        questions: quiz.questions || []
      });
    } else {
      // 생성 모드일 때 기본값 설정
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      setFormData({
        title: '',
        description: '',
        startTime: now.toISOString().slice(0, 16),
        endTime: tomorrow.toISOString().slice(0, 16),
        timeLimitMinutes: '30',
        questions: [{
          questionText: '',
          questionType: 'MULTIPLE_CHOICE',
          options: ['', ''],
          correctAnswer: '',
          points: 10,
          orderIndex: 0
        }]
      });
    }
  }, [quiz]);

  // ============================================================================
  // 폼 핸들러
  // ============================================================================

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    
    // 객관식에서 단답형으로 변경 시 옵션 초기화
    if (field === 'questionType' && value === 'SHORT_ANSWER') {
      newQuestions[index].options = [];
    } else if (field === 'questionType' && value === 'MULTIPLE_CHOICE' && !newQuestions[index].options) {
      newQuestions[index].options = ['', ''];
    }
    
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const addQuestion = () => {
    const newQuestion = {
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      options: ['', ''],
      correctAnswer: '',
      points: 10,
      orderIndex: formData.questions.length
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length <= 1) {
      alert('최소 1개의 문제가 필요합니다.');
      return;
    }
    
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    // orderIndex 재정렬
    newQuestions.forEach((q, i) => {
      q.orderIndex = i;
    });
    
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options.push('');
    
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...formData.questions];
    if (newQuestions[questionIndex].options.length <= 2) {
      alert('최소 2개의 선택지가 필요합니다.');
      return;
    }
    
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  // ============================================================================
  // 제출 핸들러
  // ============================================================================

  const validateForm = () => {
    const newErrors = {};
    
    // 기본 정보 검증
    if (!formData.title.trim()) {
      newErrors.title = '퀴즈 제목을 입력해주세요.';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = '시작 시간을 선택해주세요.';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = '종료 시간을 선택해주세요.';
    }
    
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다.';
    }
    
    // 문제 검증
    formData.questions.forEach((question, index) => {
      if (!question.questionText.trim()) {
        newErrors[`question_${index}_text`] = '문제 내용을 입력해주세요.';
      }
      
      if (!question.correctAnswer.trim()) {
        newErrors[`question_${index}_answer`] = '정답을 입력해주세요.';
      }
      
      if (question.questionType === 'MULTIPLE_CHOICE') {
        if (question.options.length < 2) {
          newErrors[`question_${index}_options`] = '최소 2개의 선택지가 필요합니다.';
        } else {
          const validOptions = question.options.filter(opt => opt.trim());
          if (validOptions.length < 2) {
            newErrors[`question_${index}_options`] = '최소 2개의 유효한 선택지가 필요합니다.';
          }
        }
      }
      
      if (question.points <= 0) {
        newErrors[`question_${index}_points`] = '점수는 0보다 커야 합니다.';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // formData를 API에 맞는 형식으로 변환
      const quizData = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        timeLimitMinutes: formData.timeLimitMinutes ? parseInt(formData.timeLimitMinutes) : null,
        questions: formData.questions.map(q => ({
          ...q,
          options: q.questionType === 'MULTIPLE_CHOICE' ? JSON.stringify(q.options) : null
        }))
      };
      
      if (isEdit) {
        await quizService.updateQuiz(classroomId, quiz.quizId, quizData, accessToken, currentUser.userId);
      } else {
        await quizService.createQuiz(classroomId, quizData, accessToken, currentUser.userId);
      }
      
      onSave();
    } catch (error) {
      console.error('퀴즈 저장 실패:', error);
      alert(`퀴즈 ${isEdit ? '수정' : '생성'}에 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // 렌더링 함수들
  // ============================================================================

  const renderQuestionForm = (question, index) => (
    <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <GripVertical className="text-gray-400" size={20} />
          <h4 className="text-lg font-medium text-gray-900">문제 {index + 1}</h4>
        </div>
        
        <button
          type="button"
          onClick={() => removeQuestion(index)}
          className="text-red-500 hover:text-red-700 transition-colors"
          disabled={formData.questions.length <= 1}
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* 문제 내용 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            문제 내용 *
          </label>
          <textarea
            value={question.questionText}
            onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            placeholder="문제를 입력하세요..."
          />
          {errors[`question_${index}_text`] && (
            <p className="text-red-500 text-sm mt-1">{errors[`question_${index}_text`]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 문제 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 유형
            </label>
            <select
              value={question.questionType}
              onChange={(e) => handleQuestionChange(index, 'questionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MULTIPLE_CHOICE">객관식</option>
              <option value="SHORT_ANSWER">단답형</option>
            </select>
          </div>

          {/* 점수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              점수 *
            </label>
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => handleQuestionChange(index, 'points', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors[`question_${index}_points`] && (
              <p className="text-red-500 text-sm mt-1">{errors[`question_${index}_points`]}</p>
            )}
          </div>

          {/* 정답 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정답 *
            </label>
            {question.questionType === 'MULTIPLE_CHOICE' ? (
              <select
                value={question.correctAnswer}
                onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">정답 선택</option>
                {question.options?.map((option, optIndex) => (
                  option.trim() && (
                    <option key={optIndex} value={option}>
                      {option}
                    </option>
                  )
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={question.correctAnswer}
                onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="정답을 입력하세요"
              />
            )}
            {errors[`question_${index}_answer`] && (
              <p className="text-red-500 text-sm mt-1">{errors[`question_${index}_answer`]}</p>
            )}
          </div>
        </div>

        {/* 객관식 선택지 */}
        {question.questionType === 'MULTIPLE_CHOICE' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                선택지 *
              </label>
              <button
                type="button"
                onClick={() => addOption(index)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                + 선택지 추가
              </button>
            </div>
            
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 min-w-[20px]">
                    {optIndex + 1}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`선택지 ${optIndex + 1}`}
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index, optIndex)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {errors[`question_${index}_options`] && (
              <p className="text-red-500 text-sm mt-1">{errors[`question_${index}_options`]}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // 메인 렌더링
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? '퀴즈 수정' : '퀴즈 생성'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
          
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                퀴즈 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="퀴즈 제목을 입력하세요"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="퀴즈에 대한 설명을 입력하세요 (선택사항)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 시작 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간 *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>

              {/* 종료 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간 *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>

              {/* 제한 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제한 시간 (분)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.timeLimitMinutes}
                  onChange={(e) => handleInputChange('timeLimitMinutes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제한 없음"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 문제 목록 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">문제 목록</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
              <span>문제 추가</span>
            </button>
          </div>

          {formData.questions.map((question, index) => renderQuestionForm(question, index))}
        </div>

        {/* 제출 버튼 */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '저장 중...' : (isEdit ? '수정 완료' : '퀴즈 생성')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizForm;