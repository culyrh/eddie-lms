import React from 'react';
import { User, Calendar, FileText, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const SubmissionList = ({ submissions, assignment, onGradeSubmission }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubmissionStatus = (submission) => {
    if (!submission.isGraded) {
      return {
        icon: <Clock size={16} className="text-yellow-500" />,
        text: '채점 대기',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    } else {
      return {
        icon: <CheckCircle size={16} className="text-green-500" />,
        text: '채점 완료',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
        <p>아직 제출된 과제가 없습니다.</p>
        <p className="text-sm">학습자들이 과제를 제출하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">제출물 현황</h4>
            <p className="text-sm text-blue-700">
              총 {submissions.length}개 제출물 | 
              채점 완료: {submissions.filter(s => s.isGraded).length}개 | 
              채점 대기: {submissions.filter(s => !s.isGraded).length}개
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700">만점: {assignment.maxScore}점</p>
          </div>
        </div>
      </div>

      {/* 제출물 목록 */}
      <div className="space-y-3">
        {submissions.map((submission) => {
          const status = getSubmissionStatus(submission);
          
          return (
            <div
              key={submission.submissionId}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 학생 정보 */}
                  <div className="flex items-center space-x-2 mb-2">
                    <User size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-900">{submission.studentName}</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                      <div className="flex items-center space-x-1">
                        {status.icon}
                        <span>{status.text}</span>
                      </div>
                    </div>
                    {submission.isLate && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50">
                        <AlertCircle size={12} className="inline mr-1" />
                        지각 제출
                      </div>
                    )}
                  </div>

                  {/* 제출 내용 미리보기 */}
                  {submission.submissionText && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {submission.submissionText}
                      </p>
                    </div>
                  )}

                  {/* 파일 링크 */}
                  {submission.fileUrl && (
                    <div className="mb-3">
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <FileText size={14} />
                        <span>첨부파일 보기</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* 제출 정보 */}
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>제출: {formatDate(submission.submittedAt)}</span>
                    </div>
                    {submission.gradedAt && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle size={12} />
                        <span>채점: {formatDate(submission.gradedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 점수 및 채점 버튼 */}
                <div className="text-right ml-4">
                  {submission.isGraded ? (
                    <div className="mb-2">
                      <div className={`text-lg font-bold ${getScoreColor(submission.score, assignment.maxScore)}`}>
                        {submission.score}점
                      </div>
                      <div className="text-xs text-gray-500">/ {assignment.maxScore}점</div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="text-lg font-bold text-gray-400">-점</div>
                      <div className="text-xs text-gray-500">/ {assignment.maxScore}점</div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => onGradeSubmission(submission)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      submission.isGraded
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {submission.isGraded ? '재채점' : '채점하기'}
                  </button>
                </div>
              </div>

              {/* 피드백 (채점 완료인 경우) */}
              {submission.isGraded && submission.feedback && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">피드백:</span> {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubmissionList;