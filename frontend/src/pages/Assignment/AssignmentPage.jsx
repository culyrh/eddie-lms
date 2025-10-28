import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AssignmentList from './AssignmentList';
import AssignmentForm from './AssignmentForm';
import AssignmentDetail from './AssignmentDetail';
import assignmentService from '../../services/assignmentService';

const AssignmentPage = ({ classroomId, currentUser, accessToken }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 과제 목록 로드
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

  useEffect(() => {
    if (classroomId && accessToken) {
      loadAssignments();
    }
  }, [classroomId, accessToken]);

  // 상세 로드
  const handleAssignmentClick = async (assignment) => {
    try {
      const fullAssignment = await assignmentService.getAssignment(
        classroomId,
        assignment.assignmentId,
        currentUser.userId,
        accessToken
      );
      setSelectedAssignment(fullAssignment);
    } catch (error) {
      console.error('과제 상세 로드 실패:', error);
      alert('과제 정보를 불러오는데 실패했습니다.');
    }
  };

  // 저장
  const handleSubmitAssignment = async (formData) => {
    try {
      setIsSubmitting(true);

      if (editingAssignment) {
        await assignmentService.updateAssignment(
          classroomId,
          editingAssignment.assignmentId,
          currentUser.userId,
          formData,
          accessToken
        );
      } else {
        await assignmentService.createAssignment(
          classroomId,
          currentUser.userId,
          formData,
          accessToken
        );
      }

      await loadAssignments();
      setShowForm(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error('과제 저장 실패:', error);
      alert('과제 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 삭제
  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await assignmentService.deleteAssignment(
        classroomId,
        assignmentId,
        currentUser.userId,
        accessToken
      );

      await loadAssignments();

      if (selectedAssignment && selectedAssignment.assignmentId === assignmentId) {
        setSelectedAssignment(null);
      }
    } catch (error) {
      console.error('과제 삭제 실패:', error);
      alert('과제 삭제에 실패했습니다.');
    }
  };

  // ────────────────────────────────
  // 분기 렌더
  // ────────────────────────────────
  if (!classroomId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">클래스룸을 선택해주세요.</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        currentUser={currentUser}
        classroomId={classroomId}
        accessToken={accessToken}
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

  // 목록
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">과제</h2>
        </div>

        {currentUser.userType === 'EDUCATOR' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow hover:opacity-90 transition"
          >
            <Plus size={18} />
            <span>과제 등록</span>
          </button>
        )}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-500">과제를 불러오는 중...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <p className="text-gray-500">등록된 과제가 없습니다.</p>
          {currentUser.userType === 'EDUCATOR' && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow hover:opacity-90 transition"
            >
              첫 과제 등록
            </button>
          )}
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
