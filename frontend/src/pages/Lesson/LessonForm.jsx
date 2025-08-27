import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, Video, Play, AlertCircle } from 'lucide-react';
import lessonService from '../../services/lessonService';

const LessonForm = ({ 
  lesson = null, 
  classroomId, 
  curriculums = [], 
  onSubmit, 
  onCancel,
  currentUser 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lessonType: 'VIDEO',
    curriculumId: '',
    scheduledAt: '',
    durationMinutes: 60,
    materials: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    fileType: 'PDF'
  });

  const isEditing = lesson !== null;

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        lessonType: lesson.lessonType || 'VIDEO',
        curriculumId: lesson.curriculumId || '',
        scheduledAt: lesson.scheduledAt ? 
          new Date(lesson.scheduledAt).toISOString().slice(0, 16) : '',
        durationMinutes: lesson.durationMinutes || 60,
        materials: lesson.materials || []
      });
    }
  }, [lesson]);

  // ============================================================================
  // 폼 핸들러
  // ============================================================================

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
    
    // 해당 필드의 에러 제거
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const validationErrors = lessonService.validateLessonData({
      ...formData,
      classroomId
    });
    
    const errorObj = {};
    validationErrors.forEach(error => {
      if (error.includes('제목')) errorObj.title = error;
      else if (error.includes('설명')) errorObj.description = error;
      else if (error.includes('유형')) errorObj.lessonType = error;
      else if (error.includes('일정')) errorObj.scheduledAt = error;
      else if (error.includes('시간')) errorObj.durationMinutes = error;
    });

    // 추가 검증
    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledDate < now && !isEditing) {
        errorObj.scheduledAt = '미래 시간을 선택해주세요.';
      }
    }

    setErrors(errorObj);
    return Object.keys(errorObj).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        classroomId,
        scheduledAt: new Date(formData.scheduledAt).toISOString()
      };

      if (isEditing) {
        await lessonService.updateLesson(lesson.lessonId, submitData, currentUser?.token);
      } else {
        await lessonService.createLesson(submitData, currentUser?.token);
      }
      
      onSubmit?.(submitData);
    } catch (error) {
      console.error('수업 저장 실패:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 학습 자료 관리
  // ============================================================================

  const handleAddMaterial = () => {
    if (!newMaterial.title.trim()) {
      alert('자료 제목을 입력해주세요.');
      return;
    }

    const material = {
      materialId: Date.now(), // 임시 ID
      title: newMaterial.title,
      fileType: newMaterial.fileType,
      fileName: `${newMaterial.title}.${newMaterial.fileType.toLowerCase()}`,
      fileSize: 0, // 파일 업로드 구현 시 실제 크기로 변경
      filePath: '', // 파일 업로드 구현 시 실제 경로로 변경
    };

    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, material]
    }));

    setNewMaterial({ title: '', fileType: 'PDF' });
    setShowMaterialForm(false);
  };

  const handleRemoveMaterial = (materialId) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.materialId !== materialId)
    }));
  };

  // ============================================================================
  // 렌더링 헬퍼
  // ============================================================================

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-4 w-4" />;
      case 'DOCUMENT': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getLessonTypeName = (type) => {
    switch (type) {
      case 'VIDEO': return '영상 수업';
      case 'DOCUMENT': return '자료 수업';
      default: return '기타';
    }
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'pptx':
      case 'ppt': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? '수업 수정' : '새 수업 생성'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 기본 정보 */}
          <div className="space-y-6">
            {/* 수업 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수업 제목 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="예: React 기초 - JSX와 컴포넌트"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* 수업 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수업 설명 *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="수업에서 다룰 내용을 간단히 설명해주세요."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* 수업 유형과 커리큘럼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수업 유형 *
                </label>
                <select
                  name="lessonType"
                  value={formData.lessonType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lessonType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="VIDEO">영상 수업</option>
                  <option value="DOCUMENT">자료 수업</option>
                </select>
                {errors.lessonType && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.lessonType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  커리큘럼
                </label>
                <select
                  name="curriculumId"
                  value={formData.curriculumId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">커리큘럼 선택 (선택사항)</option>
                  {curriculums.map((curriculum) => (
                    <option key={curriculum.curriculumId} value={curriculum.curriculumId}>
                      {curriculum.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 일정과 시간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수업 일정 *
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.scheduledAt ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.scheduledAt && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.scheduledAt}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수업 시간 (분) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    min="1"
                    max="480"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.durationMinutes ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.durationMinutes && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.durationMinutes}
                  </p>
                )}
              </div>
            </div>

            {/* 학습 자료 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  학습 자료
                </label>
                <button
                  type="button"
                  onClick={() => setShowMaterialForm(true)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  자료 추가
                </button>
              </div>

              {/* 기존 학습 자료 목록 */}
              {formData.materials.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.materials.map((material) => (
                    <div
                      key={material.materialId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileTypeIcon(material.fileType)}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {material.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {material.fileType} 파일
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(material.materialId)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 자료 추가 폼 */}
              {showMaterialForm && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      자료 제목
                    </label>
                    <input
                      type="text"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: React 기초 참고자료"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      파일 유형
                    </label>
                    <select
                      value={newMaterial.fileType}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, fileType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PDF">PDF</option>
                      <option value="PPTX">PowerPoint</option>
                      <option value="DOCX">Word 문서</option>
                      <option value="ZIP">압축 파일</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMaterialForm(false);
                        setNewMaterial({ title: '', fileType: 'PDF' });
                      }}
                      className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                * 실제 파일 업로드는 S3 연동 후 구현 예정입니다. 현재는 메타데이터만 저장됩니다.
              </div>
            </div>

            {/* 수업 유형별 안내 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                {getLessonTypeIcon(formData.lessonType)}
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    {getLessonTypeName(formData.lessonType)} 안내
                  </h4>
                  <p className="text-sm text-blue-800">
                    {formData.lessonType === 'VIDEO' && '영상 파일을 업로드하면 학생들이 언제든 시청할 수 있습니다. 시청 진도율이 자동으로 추적됩니다.'}
                    {formData.lessonType === 'DOCUMENT' && 'PDF, PPT, Word 등의 문서를 업로드하면 학생들이 브라우저에서 바로 볼 수 있습니다.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEditing ? '수정 중...' : '생성 중...'}</span>
                </div>
              ) : (
                isEditing ? '수업 수정' : '수업 생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;