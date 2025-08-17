import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

const SubmissionForm = ({ 
  onSubmit, 
  onCancel, 
  assignment, 
  existingSubmission = null, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    submissionText: existingSubmission?.submissionText || '',
    fileUrl: existingSubmission?.fileUrl || ''
  });

  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit(formData);
    }
  };

  const isFormValid = () => {
    return formData.submissionText.trim() || formData.fileUrl.trim();
  };

  const isOverdue = () => {
    return new Date() > new Date(assignment.dueDate);
  };

  const formatDueDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 마감된 과제인 경우
  if (isOverdue() && !existingSubmission) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">과제 마감</h3>
          <p className="text-gray-600">이 과제는 이미 마감되었습니다.</p>
          <p className="text-sm text-gray-500 mt-2">
            마감일: {formatDueDate(assignment.dueDate)}
          </p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {existingSubmission ? '과제 재제출' : '과제 제출'}
        </h3>
        <p className="text-gray-600">과제: {assignment.title}</p>
        <p className="text-sm text-gray-500">
          마감일: {formatDueDate(assignment.dueDate)}
        </p>
      </div>

      {/* 기존 제출물이 있는 경우 안내 */}
      {existingSubmission && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">기존 제출물</p>
              <p className="text-sm text-yellow-700 mt-1">
                이미 제출한 과제가 있습니다. 재제출하면 기존 제출물이 대체됩니다.
              </p>
              {existingSubmission.score && (
                <p className="text-sm text-yellow-700 mt-1">
                  기존 점수: {existingSubmission.score}점 / {assignment.maxScore}점
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 텍스트 제출 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            과제 내용
          </label>
          <textarea
            value={formData.submissionText}
            onChange={(e) => setFormData({ ...formData, submissionText: e.target.value })}
            placeholder="과제 답안이나 설명을 입력하세요..."
            rows={8}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 파일 URL (임시) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            파일 URL (선택사항)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="첨부파일 URL을 입력하세요 (예: Google Drive, Dropbox 링크)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            현재는 파일 URL만 지원됩니다. 추후 업데이트에서 직접 파일 업로드가 가능합니다.
          </p>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📝 제출 안내</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 과제 내용 또는 파일 URL 중 최소 하나는 입력해야 합니다.</li>
            <li>• 제출 후에도 마감일 전까지 재제출이 가능합니다.</li>
            <li>• 재제출 시 이전 제출물은 덮어쓰여집니다.</li>
          </ul>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end space-x-3 mt-8">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !isFormValid()}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '제출 중...' : (existingSubmission ? '재제출' : '제출하기')}
        </button>
      </div>
    </div>
  );
};

export default SubmissionForm;