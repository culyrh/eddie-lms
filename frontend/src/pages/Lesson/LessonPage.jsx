import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  FileText, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen,
  Video,
  File,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import lessonService from '../../services/lessonService';
import LessonForm from './LessonForm';

const LessonPage = ({ classroom, currentUser }) => {
  const [lessons, setLessons] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'curriculum', 'detail'

  const isEducator = currentUser?.userType === 'EDUCATOR';

  useEffect(() => {
    loadLessons();
    loadCurriculums();
  }, [classroom]);

  // ============================================================================
  // 데이터 로딩
  // ============================================================================
  
  const loadLessons = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출로 변경 (Mock 데이터는 API가 준비될 때까지 유지)
      // const lessons = await lessonService.getLessonsByClassroom(classroom.classroomId, currentUser?.token);
      // setLessons(lessons);
      
      // 임시 Mock 데이터 (API 준비될 때까지)
      const mockLessons = [
        {
          lessonId: 1,
          curriculumId: 1,
          title: "React 기초 - JSX와 컴포넌트",
          description: "React의 기본 개념과 JSX 문법을 학습합니다.",
          lessonType: "VIDEO",
          scheduledAt: "2024-08-28T10:00:00",
          durationMinutes: 90,
          isCompleted: false,
          materials: [
            { materialId: 1, title: "React 기초 자료.pdf", fileType: "PDF", fileSize: 2048576 },
            { materialId: 2, title: "실습 예제 코드.zip", fileType: "ZIP", fileSize: 1024000 }
          ],
          progressInfo: {
            totalStudents: 25,
            completedStudents: 15,
            averageProgress: 75.5
          }
        },
        {
          lessonId: 2,
          curriculumId: 1,
          title: "State와 Props 심화",
          description: "React의 상태 관리와 Props 전달 방법을 자세히 다룹니다.",
          lessonType: "LIVE",
          scheduledAt: "2024-08-30T14:00:00",
          durationMinutes: 120,
          isCompleted: false,
          materials: [
            { materialId: 3, title: "State 관리 가이드.pdf", fileType: "PDF", fileSize: 3072000 }
          ],
          progressInfo: {
            totalStudents: 25,
            completedStudents: 8,
            averageProgress: 45.0
          }
        },
        {
          lessonId: 3,
          curriculumId: 2,
          title: "Hook 활용하기",
          description: "useState, useEffect 등 React Hook 활용법",
          lessonType: "PDF",
          scheduledAt: "2024-09-02T16:00:00",
          durationMinutes: 60,
          isCompleted: true,
          materials: [
            { materialId: 4, title: "Hook 완전 정복.pdf", fileType: "PDF", fileSize: 5120000 },
            { materialId: 5, title: "Hook 실습.pptx", fileType: "PPTX", fileSize: 7168000 }
          ],
          progressInfo: {
            totalStudents: 25,
            completedStudents: 22,
            averageProgress: 92.3
          }
        }
      ];
      
      setLessons(mockLessons);
    } catch (error) {
      console.error('수업 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculums = async () => {
    try {
      // 실제 API 호출로 변경 (Mock 데이터는 API가 준비될 때까지 유지)
      // const curriculums = await lessonService.getCurriculumsByClassroom(classroom.classroomId, currentUser?.token);
      // setCurriculums(curriculums);
      
      // 커리큘럼 목록 로드 (임시 Mock 데이터)
      const mockCurriculums = [
        {
          curriculumId: 1,
          title: "React 기초 과정",
          description: "React 개발의 기초를 다지는 과정",
          orderIndex: 1,
          lessons: [1, 2] // lesson ID 배열
        },
        {
          curriculumId: 2,
          title: "React 고급 활용",
          description: "실전 React 개발 기법",
          orderIndex: 2,
          lessons: [3]
        }
      ];
      
      setCurriculums(mockCurriculums);
    } catch (error) {
      console.error('커리큘럼 로드 실패:', error);
    }
  };

  // ============================================================================
  // 이벤트 핸들러
  // ============================================================================

  const handleCreateLesson = () => {
    setShowCreateForm(true);
    setSelectedLesson(null);
  };

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setShowCreateForm(true);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('정말로 이 수업을 삭제하시겠습니까?')) {
      try {
        // 실제 API 호출
        await lessonService.deleteLesson(lessonId, currentUser?.token);
        console.log('수업 삭제 성공:', lessonId);
        loadLessons(); // 새로고침
      } catch (error) {
        console.error('수업 삭제 실패:', error);
        alert('수업 삭제에 실패했습니다.');
      }
    }
  };

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setActiveView('detail');
  };

  const handleDownloadMaterial = (material) => {
    // 파일 다운로드 로직 (나중에 S3 Presigned URL로 구현 예정)
    console.log('다운로드:', material);
  };

  // ============================================================================
  // 렌더링 헬퍼 함수
  // ============================================================================

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-4 w-4" />;
      case 'DOCUMENT': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
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
      case 'zip': 
      case 'rar': return <File className="h-4 w-4 text-yellow-500" />;
      case 'pptx':
      case 'ppt': return <File className="h-4 w-4 text-orange-500" />;
      default: return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // ============================================================================
  // 수업 목록 렌더링
  // ============================================================================

  const renderLessonList = () => {
    return (
      <div>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">수업</h2>
            <p className="text-gray-600 mt-1">클래스룸의 모든 수업을 관리하고 학습하세요.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveView('curriculum')}
              className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              커리큘럼 보기
            </button>
            {isEducator && (
              <button
                onClick={handleCreateLesson}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                수업 생성
              </button>
            )}
          </div>
        </div>

        {/* 수업 목록 */}
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 수업이 없습니다</h3>
              <p className="text-gray-600 mb-6">
                {isEducator 
                  ? '첫 번째 수업을 생성해보세요.' 
                  : '교육자가 수업을 추가할 때까지 기다려주세요.'}
              </p>
              {isEducator && (
                <button
                  onClick={handleCreateLesson}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  첫 수업 만들기
                </button>
              )}
            </div>
          ) : (
            lessons.map((lesson) => (
              <div
                key={lesson.lessonId}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleLessonClick(lesson)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        {getLessonTypeIcon(lesson.lessonType)}
                        <span className="text-sm font-medium text-blue-600">
                          {getLessonTypeName(lesson.lessonType)}
                        </span>
                      </div>
                      {lesson.isCompleted && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          완료됨
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {lesson.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(lesson.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{lesson.durationMinutes}분</span>
                      </div>
                      {isEducator && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {lesson.progressInfo.completedStudents}/{lesson.progressInfo.totalStudents} 완료
                            ({lesson.progressInfo.averageProgress.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 학습 자료 */}
                    {lesson.materials && lesson.materials.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">학습 자료</h4>
                        <div className="flex flex-wrap gap-2">
                          {lesson.materials.map((material) => (
                            <div
                              key={material.materialId}
                              className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-md text-sm"
                            >
                              {getFileTypeIcon(material.fileType)}
                              <span className="text-gray-700">{material.title}</span>
                              <span className="text-gray-500">({formatFileSize(material.fileSize)})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 (교육자용) */}
                  {isEducator && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLesson(lesson);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(lesson.lessonId);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // 커리큘럼 뷰 렌더링
  // ============================================================================

  const renderCurriculumView = () => {
    return (
      <div>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => setActiveView('list')}
              className="text-blue-600 hover:text-blue-800 text-sm mb-2"
            >
              ← 수업 목록으로 돌아가기
            </button>
            <h2 className="text-2xl font-bold text-gray-900">커리큘럼</h2>
            <p className="text-gray-600 mt-1">체계적으로 구성된 학습 과정을 확인하세요.</p>
          </div>
        </div>

        {/* 커리큘럼 목록 */}
        <div className="space-y-6">
          {curriculums.map((curriculum, index) => {
            const curriculumLessons = lessons.filter(lesson => 
              curriculum.lessons.includes(lesson.lessonId)
            );
            
            return (
              <div key={curriculum.curriculumId} className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{curriculum.title}</h3>
                  </div>
                  <p className="text-gray-600 ml-11">{curriculum.description}</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {curriculumLessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.lessonId}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <span className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                          {lessonIndex + 1}
                        </span>
                        <div className="flex items-center space-x-2">
                          {getLessonTypeIcon(lesson.lessonType)}
                          <span className="text-sm text-blue-600">
                            {getLessonTypeName(lesson.lessonType)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                          <p className="text-sm text-gray-600">{lesson.durationMinutes}분</p>
                        </div>
                        {lesson.isCompleted && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            완료
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================================
  // 수업 상세 뷰 렌더링
  // ============================================================================

  const renderLessonDetail = () => {
    if (!selectedLesson) return null;

    return (
      <div>
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => {
              setActiveView('list');
              setSelectedLesson(null);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4"
          >
            ← 수업 목록으로 돌아가기
          </button>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  {getLessonTypeIcon(selectedLesson.lessonType)}
                  <span className="text-sm font-medium text-blue-600">
                    {getLessonTypeName(selectedLesson.lessonType)}
                  </span>
                  {selectedLesson.isCompleted && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      완료됨
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedLesson.title}
                </h1>
                <p className="text-gray-600 mb-4">
                  {selectedLesson.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedLesson.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedLesson.durationMinutes}분</span>
                  </div>
                </div>
              </div>
              
              {isEducator && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditLesson(selectedLesson)}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="h-4 w-4 inline mr-2" />
                    수정
                  </button>
                </div>
              )}
            </div>

            {/* 학습 진도 (교육자용) */}
            {isEducator && selectedLesson.progressInfo && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">학습 현황</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedLesson.progressInfo.completedStudents}
                    </div>
                    <div className="text-sm text-blue-800">완료한 학생</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {selectedLesson.progressInfo.totalStudents}
                    </div>
                    <div className="text-sm text-gray-800">총 학생 수</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedLesson.progressInfo.averageProgress.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-800">평균 진도율</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 학습 자료 */}
        {selectedLesson.materials && selectedLesson.materials.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">학습 자료</h3>
            <div className="space-y-3">
              {selectedLesson.materials.map((material) => (
                <div
                  key={material.materialId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getFileTypeIcon(material.fileType)}
                    <div>
                      <h4 className="font-medium text-gray-900">{material.title}</h4>
                      <p className="text-sm text-gray-600">
                        {material.fileType} • {formatFileSize(material.fileSize)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadMaterial(material)}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    다운로드
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 수업 내용 영역 (파일 처리 영역 - 나중에 구현 예정) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">수업 내용</h3>
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 mb-4">
              {selectedLesson.lessonType === 'VIDEO' && <Video className="h-12 w-12 mx-auto" />}
              {selectedLesson.lessonType === 'DOCUMENT' && <FileText className="h-12 w-12 mx-auto" />}
            </div>
            <p className="text-gray-600">
              {selectedLesson.lessonType === 'VIDEO' && '영상 플레이어 영역 (파일 처리 후 구현 예정)'}
              {selectedLesson.lessonType === 'DOCUMENT' && '문서 뷰어 영역 (파일 처리 후 구현 예정)'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 메인 렌더링
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">수업을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {activeView === 'list' && renderLessonList()}
      {activeView === 'curriculum' && renderCurriculumView()}
      {activeView === 'detail' && renderLessonDetail()}
      
      {/* 수업 생성/수정 폼은 별도 컴포넌트로 분리 예정 */}
      {showCreateForm && (
        <LessonForm
          lesson={selectedLesson}
          classroomId={classroom?.classroomId}
          curriculums={curriculums}
          onSubmit={(lessonData) => {
            console.log('수업 저장됨:', lessonData);
            setShowCreateForm(false);
            setSelectedLesson(null);
            loadLessons(); // 목록 새로고침
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setSelectedLesson(null);
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default LessonPage;