import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, Users, Plus, FileText, Video, Edit, Eye, Download, Upload, X } from 'lucide-react';
import LessonForm from './LessonForm';
import lessonService from '../../services/lessonService';
import { multipartUploadService } from '../../services/multipartUploadService.js';

const LessonPage = ({ classroomId, currentUser, accessToken }) => {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false); // 추가된 상태
  const [error, setError] = useState('');
  
  // 업로드 관련 상태 (최소한만)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // useCallback으로 감싸서 dependency 경고 해결
  const loadLessons = useCallback(async () => {
    if (!classroomId || !currentUser?.userId) return;

    try {
      setIsLoading(true);
      setError('');
      
      const lessonList = await lessonService.getLessons(
        classroomId, 
        currentUser.userId,
        accessToken
      );
      setLessons(lessonList);
    } catch (error) {
      console.error('수업 목록 로드 실패:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, currentUser?.userId, accessToken]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]); // loadLessons dependency 추가

  // 클래스룸이 바뀔 때 상태 초기화
  useEffect(() => {
    setSelectedLesson(null);
    setLearningMaterials([]);
    setError('');
  }, [classroomId]);

  // 학습자료 목록 로드
  const loadLearningMaterials = async (lessonId) => {
    try {
      setMaterialsLoading(true);
    
      const response = await fetch(
        `http://localhost:8080/api/classrooms/${classroomId}/lessons/${lessonId}/materials`,
        {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('학습자료를 불러오는데 실패했습니다.');
      }

      const result = await response.json();
      
      if (result.success) {
        setLearningMaterials(result.data || []);
        console.log(`학습자료 ${result.count || 0}개 로드됨`);
      } else {
        throw new Error(result.error || '학습자료 로드 실패');
      }

    } catch (error) {
      console.error('학습자료 로드 실패:', error);
      setError(error.message);
      setLearningMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  // 수업 선택 핸들러
  const handleLessonClick = async (lesson) => {
    try {
      const lessonDetail = await lessonService.getLessonDetail(
        classroomId,
        lesson.lessonId,
        accessToken,
        currentUser.userId
      );
    
      setSelectedLesson(lessonDetail);
      await loadLearningMaterials(lesson.lessonId);
    
    } catch (error) {
      console.error('수업 상세 조회 실패:', error);
      alert(`수업 정보를 불러올 수 없습니다: ${error.message}`);
    }
  };

  // 파일 업로드 핸들러 (핵심만)
  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('파일과 제목을 모두 입력해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. S3에 파일 업로드
      console.log('S3 업로드 시작...');
      const uploadResult = await multipartUploadService.uploadFile(
        uploadFile,
        (progress) => setUploadProgress(progress),
        accessToken
      );

      console.log('S3 업로드 완료:', uploadResult);

      // 2. 백엔드에 메타데이터 저장
      const saveResponse = await fetch(
        `http://localhost:8080/api/classrooms/${classroomId}/lessons/${selectedLesson.lessonId}/materials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            title: uploadTitle,
            fileName: uploadFile.name,
            fileUrl: uploadResult.fileUrl,
            fileSize: uploadFile.size,
            fileType: uploadFile.type
          })
        }
      );

      if (!saveResponse.ok) {
        throw new Error('메타데이터 저장 실패');
      }

      console.log('업로드 완료!');
      
      // 상태 초기화 및 새로고침
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadProgress(0);
      
      // 학습자료 목록 새로고침
      await loadLearningMaterials(selectedLesson.lessonId);
      
      alert('파일이 성공적으로 업로드되었습니다!');

    } catch (error) {
      console.error('업로드 실패:', error);
      alert(`업로드에 실패했습니다: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 기존 핸들러들 (변경 없음)
  const handleEditLesson = () => {
    if (!selectedLesson) return;
    setEditingLesson(selectedLesson);
    setShowForm(true);
  };

  const handleAddLesson = () => {
    setEditingLesson(null);
    setShowForm(true);
  };

  const handleLessonSubmit = async (lessonData) => {
    await loadLessons();
    setShowForm(false);
    setEditingLesson(null);
  };

  // 기존 자료 보기/다운로드 핸들러들
  const handleViewMaterial = async (material) => {
    try {
      console.log('자료 보기:', material.fileName);
    
      // 백엔드에서 Pre-signed URL 받기
      const response = await fetch(
        `http://localhost:8080/api/classrooms/${classroomId}/lessons/${selectedLesson.lessonId}/materials/${material.materialId}/view`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('파일 보기 링크를 가져오는데 실패했습니다.');
      }

      const result = await response.json();
      
      if (result.success && result.viewUrl) {
        // 새 탭에서 파일 열기
        window.open(result.viewUrl, '_blank');
      } else {
        throw new Error(result.error || '파일 보기에 실패했습니다.');
      }

    } catch (error) {
      console.error('파일 보기 실패:', error);
      alert(`파일을 열 수 없습니다: ${error.message}`);
    }
  };

  const handleDownloadMaterial = async (material) => {
    try {
      console.log('자료 다운로드:', material.fileName);
    
      // 백엔드에서 Pre-signed URL 받기
      const response = await fetch(
        `http://localhost:8080/api/classrooms/${classroomId}/lessons/${selectedLesson.lessonId}/materials/${material.materialId}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('다운로드 링크를 가져오는데 실패했습니다.');
      }

      const result = await response.json();
    
      if (result.success && result.downloadUrl) {
        // 다운로드 링크로 이동
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName || material.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(result.error || '다운로드에 실패했습니다.');
      }

    } catch (error) {
      console.error('다운로드 실패:', error);
      alert(`다운로드에 실패했습니다: ${error.message}`);
    }
  };

  // 학습자료 렌더링
  const renderLearningMaterials = () => {
    if (!selectedLesson) return null;

    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">학습자료</h3>
          {currentUser?.userType === 'EDUCATOR' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Upload className="h-4 w-4" />
              <span>자료 업로드</span>
            </button>
          )}
        </div>
      
        {materialsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500">학습자료를 불러오는 중...</p>
          </div>
        ) : learningMaterials && learningMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningMaterials.map((material) => (
              <div key={material.materialId} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{material.title}</h4>
                    <p className="text-sm text-gray-500 mb-2">{material.fileName}</p>
                    <p className="text-xs text-gray-400">
                      {material.formattedFileSize || (material.fileSize ? `${(material.fileSize / 1024 / 1024).toFixed(1)}MB` : '크기 미상')} • 
                      {material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : '날짜 미상'}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    <button
                      onClick={() => handleViewMaterial(material)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="보기"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadMaterial(material)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="다운로드"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>학습자료가 없습니다.</p>
            {currentUser?.userType === 'EDUCATOR' && (
              <p className="text-sm mt-2">
                '자료 업로드' 버튼을 클릭하여 학습자료를 업로드하세요.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderLessonTypeIcon = (type) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  if (showForm) {
    return (
      <LessonForm
        classroomId={classroomId}
        lesson={editingLesson}
        currentUser={currentUser}
        onSubmit={handleLessonSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingLesson(null);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">수업 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">오류가 발생했습니다: {error}</p>
          <button
            onClick={loadLessons}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* 왼쪽: 수업 목록 */}
      <div className="w-1/3 border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">수업 목록</h2>
          {currentUser?.userType === 'EDUCATOR' && (
            <button 
              onClick={handleAddLesson}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">등록된 수업이 없습니다.</p>
            {currentUser?.userType === 'EDUCATOR' && (
              <button 
                onClick={handleAddLesson}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                첫 수업 만들기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div
                key={lesson.lessonId}
                onClick={() => handleLessonClick(lesson)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedLesson?.lessonId === lesson.lessonId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {renderLessonTypeIcon(lesson.lessonType)}
                  <h3 className="font-medium text-gray-900 truncate">{lesson.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{lesson.description}</p>
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {lesson.durationMinutes || 0}분
                  </span>
                  {lesson.completionRate !== undefined && (
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      진행률 {Math.round(lesson.completionRate)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 오른쪽: 수업 상세 및 자료 */}
      <div className="flex-1 p-6">
        {!selectedLesson ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">수업을 선택해주세요</h3>
              <p className="text-gray-500">왼쪽 목록에서 수업을 클릭하여 상세 정보를 확인하세요.</p>
            </div>
          </div>
        ) : (
          <div>
            {/* 수업 상세 정보 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {renderLessonTypeIcon(selectedLesson.lessonType)}
                  <h1 className="text-2xl font-bold text-gray-900">{selectedLesson.title}</h1>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{selectedLesson.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">수업 시간</div>
                  <div className="font-semibold">{selectedLesson.durationMinutes || 0}분</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">학습 자료</div>
                  <div className="font-semibold">{learningMaterials?.length || 0}개</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">진행률</div>
                  <div className="font-semibold">{Math.round(selectedLesson.completionRate || 0)}%</div>
                </div>
              </div>

              {/* 학습자료 목록 렌더링 */}
              {renderLearningMaterials()}
            </div>

            {/* 교육자용 수업 관리 */}
            {currentUser?.userType === 'EDUCATOR' && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">수업 관리</h2>
                </div>
                <div className="p-6">
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleEditLesson}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>수업 수정</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 업로드 모달 (간단한 버전) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">학습 자료 업로드</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    자료 제목
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="예: React 기초 참고자료"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    파일 선택
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {uploadFile ? (
                      <div className="text-sm text-gray-600">
                        <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="font-medium">{uploadFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {!isUploading && (
                          <button
                            onClick={() => setUploadFile(null)}
                            className="mt-2 text-red-500 text-xs hover:underline"
                          >
                            파일 제거
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">파일을 선택해주세요</p>
                        <input
                          type="file"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                          disabled={isUploading}
                          className="hidden"
                          id="upload-input"
                        />
                        <button
                          onClick={() => document.getElementById('upload-input').click()}
                          disabled={isUploading}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors disabled:bg-gray-400"
                        >
                          파일 선택
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 업로드 진행률 */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>업로드 중...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
                >
                  취소
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={isUploading || !uploadFile || !uploadTitle.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                >
                  {isUploading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPage;