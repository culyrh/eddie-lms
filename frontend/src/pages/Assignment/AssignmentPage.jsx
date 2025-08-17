import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AssignmentList from './AssignmentList';
import AssignmentForm from './AssignmentForm';
import AssignmentDetail from './AssignmentDetail';
import assignmentService from '../../services/assignmentService';

const AssignmentPage = ({ classroomId, currentUser, accessToken }) => {   // accessToken 추가
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 과제 목록 로드 (토큰 전달)
  const loadAssignments = async () => {
    if (!classroomId || !accessToken) return;
    
    try {
      setIsLoading(true);
      const assignmentList = await assignmentService.getAssignments(classroomId, accessToken);
      setAssignments(assignmentList);
    } catch (error) {
      console.error('과제 목록 로드 실패:', error);
      alert('과제 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (classroomId && accessToken) {
      loadAssignments();
    }
  }, [classroomId, accessToken]);

  // 과제 클릭 핸들러 (토큰 전달)
  const handleAssignmentClick = async (assignment) => {
    try {
      // 상세 정보 로드 (제출물 포함)
      const fullAssignment = await assignmentService.getAssignment(
        classroomId, 
        assignment.assignmentId, 
        currentUser.userId,
        accessToken // 토큰 추가
      );
      setSelectedAssignment(fullAssignment);
    } catch (error) {
      console.error('과제 상세 로드 실패:', error);
      alert('과제 정보를 불러오는데 실패했습니다.');
    }
  };

  // 과제 생성/수정 핸들러 (토큰 전달)
  const handleSubmitAssignment = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingAssignment) {
        // 수정
        await assignmentService.updateAssignment(
          classroomId,
          editingAssignment.assignmentId,
          currentUser.userId,
          formData,
          accessToken   // 토큰 추가
        );
      } else {
        // 새 생성
        await assignmentService.createAssignment(
          classroomId,
          currentUser.userId,
          formData,
          accessToken   // 토큰 추가
        );
      }
      
      // 목록 새로고침
      await loadAssignments();
      
      // 폼 닫기
      setShowForm(false);
      setEditingAssignment(null);
      
    } catch (error) {
      console.error('과제 저장 실패:', error);
      alert('과제 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 과제 삭제 핸들러 (토큰 전달)
  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await assignmentService.deleteAssignment(
        classroomId, 
        assignmentId, 
        currentUser.userId,
        accessToken   // 토큰 추가
      );
      
      // 목록에서 제거
      await loadAssignments();
      
      // 상세보기에서 삭제된 경우 목록으로 이동
      if (selectedAssignment && selectedAssignment.assignmentId === assignmentId) {
        setSelectedAssignment(null);
      }
      
    } catch (error) {
      console.error('과제 삭제 실패:', error);
      alert('과제 삭제에 실패했습니다.');
    }
  };

  // 클래스룸이 선택되지 않은 경우
  if (!classroomId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">클래스룸을 선택해주세요.</p>
      </div>
    );
  }

  // 토큰이 없는 경우 (추가)
  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  // 과제 상세 보기
  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        currentUser={currentUser}
        classroomId={classroomId}
        accessToken={accessToken}   // 토큰 전달
        onBack={() => setSelectedAssignment(null)}
        onEdit={(assignment) => {
          setEditingAssignment(assignment);
          setSelectedAssignment(null);
          setShowForm(true);
        }}
        onDelete={handleDeleteAssignment}
      />
    );
  }

  // 과제 생성/수정 폼
  if (showForm) {
    return (
      <AssignmentForm
        onSubmit={handleSubmitAssignment}
        onCancel={() => {
          setShowForm(false);
          setEditingAssignment(null);
        }}
        initialData={editingAssignment}
        isLoading={isSubmitting}
      />
    );
  }

  // 과제 목록 (기본 화면)
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">과제 관리</h2>
          <p className="text-gray-600 mt-1">
            {currentUser.userType === 'EDUCATOR' 
              ? '과제를 등록하고 학습자들의 제출물을 관리하세요.' 
              : '등록된 과제를 확인하고 제출하세요.'
            }
          </p>
        </div>
        
        {currentUser.userType === 'EDUCATOR' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            <span>과제 등록</span>
          </button>
        )}
      </div>

      {/* 과제 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500">과제를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <AssignmentList
          assignments={assignments}
          onAssignmentClick={handleAssignmentClick}
          onDeleteAssignment={handleDeleteAssignment}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default AssignmentPage;