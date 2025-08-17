import React, { useState } from 'react';

const AssignmentForm = ({ onSubmit, onCancel, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : '',
    maxScore: initialData?.maxScore || 100
  });

  const handleSubmit = () => {
    if (isFormValid()) {
      const submitData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        maxScore: parseInt(formData.maxScore)
      };
      onSubmit(submitData);
    }
  };

  const isFormValid = () => {
    return formData.title.trim() && 
           formData.description.trim() && 
           formData.dueDate && 
           formData.maxScore > 0;
  };

  const handleDateChange = (e) => {
    setFormData({ ...formData, dueDate: e.target.value });
  };

  const handleScoreChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0 && value <= 1000) {
      setFormData({ ...formData, maxScore: value });
    }
  };

  // 최소 날짜 설정 (현재 시간)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">
        {initialData ? '과제 수정' : '새 과제 등록'}
      </h3>
      
      <div className="space-y-6">
        {/* 과제 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            과제 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="과제 제목을 입력하세요"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={255}
          />
        </div>
        
        {/* 과제 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            과제 설명 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="과제에 대한 상세한 설명을 입력하세요"
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 마감일과 만점 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 마감일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              마감일 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleDateChange}
              min={minDateTime}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* 만점 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              만점 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.maxScore}
                onChange={handleScoreChange}
                min="1"
                max="1000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">점</span>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📋 과제 등록 안내</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 마감일은 현재 시간 이후로만 설정할 수 있습니다.</li>
            <li>• 과제 등록 후 학습자들이 제출할 수 있습니다.</li>
            <li>• 만점은 1점부터 1000점까지 설정 가능합니다.</li>
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
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '저장 중...' : (initialData ? '수정 완료' : '과제 등록')}
        </button>
      </div>
    </div>
  );
};

export default AssignmentForm;