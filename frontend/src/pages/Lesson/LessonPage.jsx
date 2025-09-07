import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, Users, Plus, FileText, Video, Edit, Eye, Download, Upload, X, CheckCircle, Play } from 'lucide-react';
import LessonForm from './LessonForm';
import lessonService from '../../services/lessonService';
import { multipartUploadService } from '../../services/multipartUploadService.js';
import VideoPlayer from '../../components/VideoPlayer';
import progressTrackingService from '../../services/progressTrackingService';

const LessonPage = ({ classroomId, currentUser, accessToken }) => {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 업로드 관련 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [videoUrl, setVideoUrl] = useState(null);

  // 진도율 관련 유틸리티 함수들
  const getLessonProgress = (lessonId) => {
    return userProgress[lessonId]?.completionPercentage || 0;
  };

  const isLessonCompleted = (lessonId) => {
    return getLessonProgress(lessonId) >= 90;
  };

  // 진도율 업데이트 핸들러
  const handleProgressUpdate = useCallback((lessonId, progress) => {
    setUserProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        completionPercentage: progress
      }
    }));

    if (progress >= 90) {
      progressTrackingService.markAsCompleted(
        lessonId, 
        currentUser?.userId, 
        accessToken
      ).catch(console.error);
    }
  }, [currentUser, accessToken]);

  // 영상 URL 설정 useEffect (하나로 통합)
  useEffect(() => {
    setVideoUrl(null);

    // 모든 조건을 한번에 체크하여 불필요한 로그 방지
    if (!selectedLesson || 
        selectedLesson.lessonType !== 'VIDEO' || 
        materialsLoading || 
        !Array.isArray(learningMaterials)) {
      return; // 조건 불충족시 조용히 종료
    }

    const videoMaterial = learningMaterials.find(material => 
      material.fileType && material.fileType.includes('video')
    );

    if (videoMaterial) {
      console.log('영상 자료 발견:', videoMaterial);
      
      fetch(`http://localhost:8080/api/classrooms/${classroomId}/lessons/${selectedLesson.lessonId}/materials/${videoMaterial.materialId}/stream`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setVideoUrl(data.streamingUrl);
          console.log('영상 URL 설정 완료:', data.streamingUrl.substring(0, 100) + '...');
        }
      })
      .catch(error => {
        console.error('스트리밍 URL 생성 실패:', error);
      });
    } else {
      // 로딩이 완전히 끝났을 때만 로그 출력
      console.log('영상 자료 없음 (학습자료 로드 완료)');
    }
  }, [selectedLesson?.lessonId, learningMaterials, materialsLoading, classroomId, accessToken]);

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

      // 모든 수업의 진도율을 한번에 로드
      await loadAllLessonProgress(lessonList);
      
    } catch (error) {
      console.error('수업 목록 로드 실패:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, currentUser?.userId, accessToken]);

  // 모든 수업의 진도율을 한번에 로드하는 함수
  const loadAllLessonProgress = async (lessonList) => {
    if (!Array.isArray(lessonList) || lessonList.length === 0) return;
    
    try {
      console.log('모든 수업 진도율 로딩 시작...');
      
      // 모든 수업의 진도율을 병렬로 조회
      const progressPromises = lessonList
        .filter(lesson => lesson.lessonType === 'VIDEO') // 영상 수업만
        .map(async (lesson) => {
          try {
            const progress = await progressTrackingService.getProgress(
              lesson.lessonId,
              currentUser?.userId,
              accessToken
            );
            return {
              lessonId: lesson.lessonId,
              progress: progress
            };
          } catch (error) {
            console.error(`진도율 로드 실패 (수업 ID: ${lesson.lessonId}):`, error);
            return {
              lessonId: lesson.lessonId,
              progress: { completionPercentage: 0, lastAccessedTime: 0 }
            };
          }
        });

      // 모든 진도율 조회 완료 대기
      const progressResults = await Promise.all(progressPromises);
      
      // 진도율 상태 업데이트
      const progressMap = {};
      progressResults.forEach(({ lessonId, progress }) => {
        progressMap[lessonId] = progress;
      });
      
      setUserProgress(progressMap);
      console.log(`진도율 로딩 완료: ${progressResults.length}개 수업`);
      
    } catch (error) {
      console.error('전체 진도율 로딩 실패:', error);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

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
      // 즉시 상태 초기화 (중요!)
      setLearningMaterials([]);
      setVideoUrl(null);
    
      const lessonDetail = await lessonService.getLessonDetail(
        classroomId,
        lesson.lessonId,
        accessToken,
        currentUser.userId
      );

      setSelectedLesson(lessonDetail);
      await loadLearningMaterials(lesson.lessonId);
  
      // 영상 수업 진도율 로드
      if (lesson.lessonType === 'VIDEO') {
        const progress = await progressTrackingService.getProgress(
          lesson.lessonId, 
          currentUser?.userId, 
          accessToken
        );
        setUserProgress(prev => ({
          ...prev,
          [lesson.lessonId]: progress
        }));
      }

    } catch (error) {
      console.error('수업 상세 조회 실패:', error);
      alert(`수업 정보를 불러올 수 없습니다: ${error.message}`);
    }
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('파일과 제목을 모두 입력해주세요.');
      return;
    }

    if (selectedLesson.lessonType === 'VIDEO' && uploadFile.type.startsWith('video/')) {
      const existingVideos = learningMaterials.filter(m => 
        m.fileType?.startsWith('video/')
      );
      if (existingVideos.length > 0) {
        alert('영상 수업은 하나의 영상만 업로드할 수 있습니다.');
        return;
      }
    }    

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('S3 업로드 시작...');
      const uploadResult = await multipartUploadService.uploadFile(
        uploadFile,
        (progress) => setUploadProgress(progress),
        accessToken
      );

      console.log('S3 업로드 완료:', uploadResult);

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
      
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadProgress(0);
      
      await loadLearningMaterials(selectedLesson.lessonId);
      
      alert('파일이 성공적으로 업로드되었습니다!');

    } catch (error) {
      console.error('업로드 실패:', error);
      alert(`업로드에 실패했습니다: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleViewMaterial = async (material) => {
    try {
      console.log('자료 보기:', material.fileName);
    
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
              {learningMaterials.map((material) => {
                // 파일 타입 확인
                const isVideoFile = material.fileType?.startsWith('video/') || 
                                   material.fileName?.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/);
              
                return (
                  <div key={material.materialId} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{material.title}</h4>
                        <p className="text-sm text-gray-500 mb-2">{material.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {material.formattedFileSize || (material.fileSize ? `${(material.fileSize / 1024 / 1024).toFixed(1)}MB` : '크기 미상')} • 
                          {material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : '날짜 미상'}
                        </p>
                        {isVideoFile && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center">
                            <Video className="h-3 w-3 mr-1" />
                            영상 파일
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-2">
                        {/* 보기 버튼 - 모든 파일에 표시 */}
                        <button
                          onClick={() => handleViewMaterial(material)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title={isVideoFile ? "영상 재생" : "파일 보기"}
                        >
                          {isVideoFile ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                          
                        {/* 다운로드 버튼 - 영상 파일이 아닌 경우만 표시 */}
                        {!isVideoFile && (
                          <button
                            onClick={() => handleDownloadMaterial(material)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            {lessons.map((lesson) => {
              const progress = getLessonProgress(lesson.lessonId);
              const completed = isLessonCompleted(lesson.lessonId);
              
              return (
                <div
                  key={lesson.lessonId}
                  onClick={() => handleLessonClick(lesson)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLesson?.lessonId === lesson.lessonId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {renderLessonTypeIcon(lesson.lessonType)}
                      <h3 className="font-medium text-gray-900 truncate">{lesson.title}</h3>
                    </div>
                    {completed && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{lesson.description}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4 mb-2">
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

                  {/* 진도율 바 (영상 수업만) */}
                  {lesson.lessonType === 'VIDEO' && (
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(progress)}% 완료
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                
                {/* 진도율 정보 (영상 수업만) */}
                {selectedLesson.lessonType === 'VIDEO' && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {Math.round(getLessonProgress(selectedLesson.lessonId))}%
                    </div>
                    <div className="text-sm text-gray-500">진도율</div>
                    {isLessonCompleted(selectedLesson.lessonId) && (
                      <div className="flex items-center justify-end space-x-1 mt-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">완료</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-6">{selectedLesson.description}</p>

              {/* 전체 진도율 바 (영상 수업만) */}
              {selectedLesson.lessonType === 'VIDEO' && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getLessonProgress(selectedLesson.lessonId)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    수업 진행률: {Math.round(getLessonProgress(selectedLesson.lessonId))}%
                  </div>
                </div>
              )}

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

              {/* 영상 플레이어 (영상 수업만) */}
              {selectedLesson.lessonType === 'VIDEO' && videoUrl && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">수업 영상</h3>
                  <VideoPlayer
                    videoUrl={videoUrl}
                    lessonId={selectedLesson.lessonId}
                    userId={currentUser?.userId}
                    token={accessToken}
                    onProgressUpdate={(progress) => handleProgressUpdate(selectedLesson.lessonId, progress)}
                    initialProgress={getLessonProgress(selectedLesson.lessonId)}
                    autoPlay={false}
                  />
                </div>
              )}

              {/* 수업 완료 버튼 (영상 수업만) */}
              {selectedLesson.lessonType === 'VIDEO' && 
               !isLessonCompleted(selectedLesson.lessonId) && 
               getLessonProgress(selectedLesson.lessonId) >= 80 && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">수업을 완료하시겠습니까?</h4>
                      <p className="text-sm text-green-700">
                        80% 이상 시청하셨습니다. 수업을 완료로 표시할 수 있습니다.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await progressTrackingService.markAsCompleted(
                            selectedLesson.lessonId,
                            currentUser?.userId,
                            accessToken
                          );
                          handleProgressUpdate(selectedLesson.lessonId, 100);
                        } catch (error) {
                          console.error('수업 완료 처리 오류:', error);
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      완료 표시
                    </button>
                  </div>
                </div>
              )}

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

      {/* 업로드 모달 */}
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