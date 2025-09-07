import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, Video, Play, AlertCircle, Upload, Trash2 } from 'lucide-react';
import lessonService from '../../services/lessonService';
import multipartUploadService from '../../services/multipartUploadService';

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
    durationMinutes: 60
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

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
        durationMinutes: lesson.durationMinutes || 60
      });
    }
  }, [lesson]);

  // ============================================================================
  // 파일 업로드 관련 핸들러
  // ============================================================================

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // 영상수업일 경우 영상 파일 개수 제한
    if (formData.lessonType === 'VIDEO') {
      const existingVideoFiles = attachedFiles.filter(file => file.type.startsWith('video/'));
      const newVideoFiles = files.filter(file => file.type.startsWith('video/'));
      
      if (existingVideoFiles.length + newVideoFiles.length > 1) {
        setErrors({ fileUpload: '영상 수업은 하나의 영상 파일만 업로드할 수 있습니다.' });
        return;
      }
    }

    // 파일 크기 제한 (100MB)
    const maxSize = 100 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setErrors({ fileUpload: '파일 크기는 100MB를 초과할 수 없습니다.' });
      return;
    }

    setAttachedFiles(prev => [...prev, ...files]);
    
    // 파일 업로드 에러 제거
    if (errors.fileUpload) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fileUpload;
        return newErrors;
      });
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileTypeInfo = (file) => {
    if (file.type.startsWith('video/')) {
      return { icon: <Video className="h-4 w-4" />, color: 'text-red-500', label: '영상' };
    } else if (file.type.startsWith('image/')) {
      return { icon: <FileText className="h-4 w-4" />, color: 'text-green-500', label: '이미지' };
    } else if (file.type.includes('pdf')) {
      return { icon: <FileText className="h-4 w-4" />, color: 'text-red-600', label: 'PDF' };
    } else if (file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
      return { icon: <FileText className="h-4 w-4" />, color: 'text-orange-500', label: 'PPT' };
    } else if (file.type.includes('document') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      return { icon: <FileText className="h-4 w-4" />, color: 'text-blue-500', label: 'DOC' };
    } else {
      return { icon: <FileText className="h-4 w-4" />, color: 'text-gray-500', label: '파일' };
    }
  };

  // ============================================================================
  // 폼 핸들러
  // ============================================================================

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // 수업 유형이 변경될 때 첨부파일 검증
    if (name === 'lessonType') {
      if (value === 'VIDEO') {
        const videoFiles = attachedFiles.filter(file => file.type.startsWith('video/'));
        if (videoFiles.length > 1) {
          setErrors({ fileUpload: '영상 수업은 하나의 영상 파일만 업로드할 수 있습니다.' });
          // 첫 번째 영상 파일만 남기고 나머지 제거
          setAttachedFiles(prev => {
            const nonVideoFiles = prev.filter(file => !file.type.startsWith('video/'));
            const firstVideoFile = prev.find(file => file.type.startsWith('video/'));
            return firstVideoFile ? [firstVideoFile, ...nonVideoFiles] : nonVideoFiles;
          });
        }
      }
    }
    
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
      // 한글 키워드로 에러 매칭
      if (error.includes('제목') || error.includes('ì œëª©')) errorObj.title = error;
      else if (error.includes('설명') || error.includes('ì„¤ëª…')) errorObj.description = error;
      else if (error.includes('유형') || error.includes('ìœ í˜•')) errorObj.lessonType = error;
      else if (error.includes('일정') || error.includes('ì¼ì •')) errorObj.scheduledAt = error;
      else if (error.includes('시간') || error.includes('ì‹œê°„')) errorObj.durationMinutes = error;
    });

    // 추가 검증
    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledDate < now && !isEditing) {
        errorObj.scheduledAt = '미래 시간을 선택해주세요.';
      }
    }

    // 영상수업 파일 검증
    if (formData.lessonType === 'VIDEO' && attachedFiles.length > 0) {
      const videoFiles = attachedFiles.filter(file => file.type.startsWith('video/'));
      if (videoFiles.length > 1) {
        errorObj.fileUpload = '영상 수업은 하나의 영상 파일만 업로드할 수 있습니다.';
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
      // scheduledAt 처리 개선
      let scheduledAtISO = null;
      if (formData.scheduledAt && formData.scheduledAt.trim()) {
        const scheduledDate = new Date(formData.scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          throw new Error('수업 일정이 올바르지 않습니다.');
        }
        scheduledAtISO = scheduledDate.toISOString();
      } 

      const submitData = {
        ...formData,
        classroomId,
        scheduledAt: scheduledAtISO
      };

      console.log('제출 데이터:', submitData);

      let createdLesson;
      if (isEditing) {
        createdLesson = await lessonService.updateLesson(classroomId, lesson.lessonId, submitData, currentUser?.token);
      } else {
        createdLesson = await lessonService.createLesson(classroomId, submitData, currentUser?.token);
      }

      // 첨부파일이 있으면 업로드 (새 수업 생성 시만)
      if (attachedFiles.length > 0 && !isEditing) {
        const lessonId = createdLesson.lessonId || createdLesson.id;
        console.log('파일 업로드 시작, lessonId:', lessonId);
        
        for (let i = 0; i < attachedFiles.length; i++) {
          const file = attachedFiles[i];
          try {
            console.log(`파일 업로드 시작: ${file.name}`);
            
            // S3에 파일 업로드
            const uploadResult = await multipartUploadService.uploadFile(
              file,
              null, // 진행률 콜백 제거 (배치 업로드이므로)
              currentUser?.token
            );

            console.log(`S3 업로드 완료: ${uploadResult.fileUrl}`);

            // 메타데이터 저장
            const saveResponse = await fetch(
              `http://localhost:8080/api/classrooms/${classroomId}/lessons/${lessonId}/materials`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({
                  title: file.name,
                  fileName: file.name,
                  fileUrl: uploadResult.fileUrl,
                  fileSize: file.size,
                  fileType: file.type
                })
              }
            );

            if (!saveResponse.ok) {
              const errorText = await saveResponse.text();
              throw new Error(`메타데이터 저장 실패: ${errorText}`);
            }

            console.log(`파일 업로드 완료: ${file.name}`);
          } catch (uploadError) {
            console.error(`파일 업로드 실패 (${file.name}):`, uploadError);
            // 파일 업로드 실패해도 수업 생성은 성공으로 처리
          }
        }
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

            {/* 학습 자료 첨부 섹션 - 새 수업 생성 시만 표시 */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학습 자료 첨부 (선택사항)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept={formData.lessonType === 'VIDEO' ? 'video/*,.pdf,.ppt,.pptx,.doc,.docx' : '.pdf,.ppt,.pptx,.doc,.docx,image/*'}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      클릭하여 파일을 선택하거나 드래그 앤 드롭하세요
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {formData.lessonType === 'VIDEO' 
                        ? '영상 파일 1개 + 추가 자료 (PDF, PPT, DOC, 이미지)'
                        : '문서 파일 (PDF, PPT, DOC, 이미지)'
                      }
                    </span>
                  </label>
                </div>

                {/* 첨부된 파일 목록 */}
                {attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">첨부된 파일 ({attachedFiles.length}개)</h4>
                    {attachedFiles.map((file, index) => {
                      const fileInfo = getFileTypeInfo(file);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className={fileInfo.color}>{fileInfo.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {fileInfo.label} • {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {errors.fileUpload && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.fileUpload}
                  </p>
                )}
              </div>
            )}

            {/* 수업 유형별 안내 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                {getLessonTypeIcon(formData.lessonType)}
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    {getLessonTypeName(formData.lessonType)} 안내
                  </h4>
                  <p className="text-sm text-blue-800">
                    {formData.lessonType === 'VIDEO' && (
                      <>
                        영상 파일을 업로드하면 학생들이 언제든 시청할 수 있습니다. 시청 진도율이 자동으로 추적됩니다.
                        <br />
                        <strong>중요:</strong> 진도율 추적을 위해 영상 파일은 하나만 업로드할 수 있습니다.
                      </>
                    )}
                    {formData.lessonType === 'DOCUMENT' && 'PDF, PPT, Word 등의 문서를 업로드하면 학생들이 브라우저에서 바로 볼 수 있습니다.'}
                  </p>
                  {isEditing && (
                    <p className="text-sm text-blue-700 mt-2 font-medium">
                      📝 학습 자료 관리는 수업 상세 페이지에서 가능합니다.
                    </p>
                  )}
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