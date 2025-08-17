import React, { useState } from 'react';
import { X, FileText, ExternalLink, User, Calendar, AlertCircle } from 'lucide-react';

const GradingPanel = ({ submission, assignment, onSubmit, onClose, isLoading = false }) => {
  const [gradeData, setGradeData] = useState({
    score: submission.score || '',
    feedback: submission.feedback || ''
  });

  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit({
        score: parseInt(gradeData.score),
        feedback: gradeData.feedback.trim()
      });
    }
  };

  const isFormValid = () => {
    const score = parseInt(gradeData.score);
    return !isNaN(score) && score >= 0 && score <= assignment.maxScore;
  };

  const handleScoreChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= assignment.maxScore)) {
      setGradeData({ ...gradeData, score: value });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    const percentage = (score / assignment.maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {submission.isGraded ? '채점 수정' : '과제 채점'}
            </h3>
            <p className="text-sm text-gray-600">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 학생 정보 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User size={20} className="text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{submission.studentName}</p>
                  <p className="text-sm text-gray-600">
                    제출일: {formatDate(submission.submittedAt)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                {submission.isLate && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm mb-1">
                    <AlertCircle size={14} />
                    <span>지각 제출</span>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  마감일: {formatDate(assignment.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* 제출 내용 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">제출 내용</h4>
            
            {submission.submissionText ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">텍스트 답안</h5>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {submission.submissionText}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-gray-500 text-center">텍스트 답안이 없습니다.</p>
              </div>
            )}

            {submission.fileUrl && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">첨부파일</h5>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FileText size={16} />
                  <span>첨부파일 보기</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

          {/* 채점 영역 */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">채점</h4>
            
            <div className="space-y-4">
              {/* 점수 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  점수 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={gradeData.score}
                      onChange={handleScoreChange}
                      min="0"
                      max={assignment.maxScore}
                      placeholder="0"
                      className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    />
                  </div>
                  <span className="text-gray-500">/ {assignment.maxScore}점</span>
                  
                  {gradeData.score && (
                    <span className={`font-medium ${getScoreColor(parseInt(gradeData.score))}`}>
                      ({Math.round((parseInt(gradeData.score) / assignment.maxScore) * 100)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* 피드백 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  피드백 (선택사항)
                </label>
                <textarea
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  placeholder="학생에게 전달할 피드백을 입력하세요..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 채점 후 학생이 점수와 피드백을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '저장 중...' : (submission.isGraded ? '수정 완료' : '채점 완료')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradingPanel;