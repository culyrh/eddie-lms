import React, { useState } from 'react';
import { Plus, Edit, Trash2, BookOpen, DragDropContext, Droppable, Draggable } from 'lucide-react';
import lessonService from '../../services/lessonService';

const CurriculumManager = ({ 
  curriculums = [], 
  lessons = [], 
  classroomId,
  onUpdate, 
  currentUser,
  isEducator 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderIndex: 0
  });
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // 폼 관리
  // ============================================================================

  const handleCreate = () => {
    setEditingCurriculum(null);
    setFormData({
      title: '',
      description: '',
      orderIndex: curriculums.length
    });
    setShowForm(true);
  };

  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    setFormData({
      title: curriculum.title,
      description: curriculum.description,
      orderIndex: curriculum.orderIndex
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = lessonService.validateCurriculumData({
      ...formData,
      classroomId
    });
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        classroomId
      };

      if (editingCurriculum) {
        await lessonService.updateCurriculum(editingCurriculum.curriculumId, submitData, currentUser?.token);
      } else {
        await lessonService.createCurriculum(submitData, currentUser?.token);
      }
      
      setShowForm(false);
      onUpdate?.();
    } catch (error) {
      console.error('커리큘럼 저장 실패:', error);
      alert('커리큘럼 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (curriculumId) => {
    if (window.confirm('정말로 이 커리큘럼을 삭제하시겠습니까?')) {
      try {
        await lessonService.deleteCurriculum(curriculumId, currentUser?.token);
        onUpdate?.();
      } catch (error) {
        console.error('커리큘럼 삭제 실패:', error);
        alert('커리큘럼 삭제에 실패했습니다.');
      }
    }
  };

  // ============================================================================
  // 렌더링
  // ============================================================================

  const getCurriculumLessons = (curriculumId) => {
    return lessons.filter(lesson => lesson.curriculumId === curriculumId);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">커리큘럼 관리</h3>
          <p className="text-sm text-gray-600">수업을 체계적으로 구성하세요.</p>
        </div>
        {isEducator && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            커리큘럼 추가
          </button>
        )}
      </div>

      {/* 커리큘럼 목록 */}
      <div className="space-y-4">
        {curriculums.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              아직 커리큘럼이 없습니다
            </h4>
            <p className="text-gray-600 mb-6">
              수업을 체계적으로 구성할 커리큘럼을 만들어보세요.
            </p>
            {isEducator && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                첫 커리큘럼 만들기
              </button>
            )}
          </div>
        ) : (
          curriculums
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((curriculum, index) => {
              const curriculumLessons = getCurriculumLessons(curriculum.curriculumId);
              
              return (
                <div key={curriculum.curriculumId} className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {curriculum.title}
                          </h4>
                          <p className="text-gray-600 mb-3">
                            {curriculum.description}
                          </p>
                          <div className="text-sm text-gray-500">
                            수업 {curriculumLessons.length}개
                          </div>
                        </div>
                      </div>
                      
                      {isEducator && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(curriculum)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(curriculum.curriculumId)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {curriculumLessons.length > 0 && (
                    <div className="p-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">포함된 수업</h5>
                      <div className="space-y-2">
                        {curriculumLessons.map((lesson) => (
                          <div
                            key={lesson.lessonId}
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-900">{lesson.title}</span>
                            <span className="text-xs text-gray-500">
                              {lesson.durationMinutes}분
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* 커리큘럼 생성/수정 폼 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCurriculum ? '커리큘럼 수정' : '새 커리큘럼 생성'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    커리큘럼 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: React 기초 과정"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="커리큘럼에 대한 설명을 입력하세요."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    순서
                  </label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={loading}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{editingCurriculum ? '수정 중...' : '생성 중...'}</span>
                      </div>
                    ) : (
                      editingCurriculum ? '수정' : '생성'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManager;