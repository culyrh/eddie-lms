import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Calendar, Clock, User, Users, FileText, CheckCircle, AlertCircle, Download, Star } from 'lucide-react';
import SubmissionForm from './SubmissionForm';
import SubmissionList from './SubmissionList';
import GradingPanel from './GradingPanel';
import assignmentService from '../../services/assignmentService';

const AssignmentDetail = ({ 
  assignment, 
  currentUser, 
  classroomId, 
  accessToken,
  onBack, 
  onEdit, 
  onDelete 
}) => {
  const [assignmentData, setAssignmentData] = useState(assignment);
  const [mySubmission, setMySubmission] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showGradingPanel, setShowGradingPanel] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser.userType === 'LEARNER' && accessToken) {
      loadMySubmission();
    }
  }, [assignment.assignmentId, accessToken]);

  const loadMySubmission = async () => {
    try {
      const submission = await assignmentService.getMySubmission(
        classroomId,
        assignment.assignmentId,
        currentUser.userId,
        accessToken
      );
      setMySubmission(submission);
    } catch (error) {
      console.error('제출물 로드 실패:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDueDateStatus = () => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const diffTime = dueDate - now;

    if (diffTime < 0) {
      return { text: '마감됨', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else {
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return { text: '오늘 마감', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      } else {
        return { text: `${diffDays}일 남음`, color: 'text-green-600', bgColor: 'bg-green-100' };
      }
    }
  };

  const handleSubmitAssignment = async (formData) => {
    try {
      setIsLoading(true);
      if (mySubmission) {
        await assignmentService.resubmitAssignment(
          classroomId,
          assignment.assignmentId,
          currentUser.userId,
          formData,
          accessToken
        );
      } else {
        await assignmentService.submitAssignment(
          classroomId,
          assignment.assignmentId,
          currentUser.userId,
          formData,
          accessToken
        );
      }
      await loadMySubmission();
      setShowSubmissionForm(false);
    } catch (error) {
      console.error('과제 제출 실패:', error);
      alert('과제 제출에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (gradeData) => {
    try {
      setIsLoading(true);
      await assignmentService.gradeSubmission(
        classroomId,
        assignment.assignmentId,
        selectedSubmission.submissionId,
        currentUser.userId,
        gradeData,
        accessToken
      );
      const updatedAssignment = await assignmentService.getAssignment(
        classroomId,
        assignment.assignmentId,
        currentUser.userId,
        accessToken
      );
      setAssignmentData(updatedAssignment);
      setShowGradingPanel(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('채점 실패:', error);
      alert('채점에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAssignment = () => {
    if (window.confirm('과제를 삭제하시겠습니까? 모든 제출물도 함께 삭제됩니다.')) {
      onDelete(assignment.assignmentId);
    }
  };

  const dueDateStatus = getDueDateStatus();

  if (showSubmissionForm) {
    return (
      <SubmissionForm
        onSubmit={handleSubmitAssignment}
        onCancel={() => setShowSubmissionForm(false)}
        assignment={assignment}
        existingSubmission={mySubmission}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <ArrowLeft size={18} />
          <span>과제 목록으로</span>
        </button>

        {currentUser.userType === 'EDUCATOR' && currentUser.userId === assignment.creatorId && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(assignment)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={handleDeleteAssignment}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 과제 카드 */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User size={16} />
                <span>{assignment.creatorName || '교육자'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>등록일: {formatDate(assignment.createdAt)}</span>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${dueDateStatus.bgColor} ${dueDateStatus.color}`}>
            {dueDateStatus.text}
          </span>
        </div>

        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
          {assignment.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border rounded-lg p-4">
            <Clock size={16} className="text-blue-600 mb-1" />
            <p className="text-sm font-medium text-blue-900">마감일</p>
            <p className="text-blue-800">{formatDate(assignment.dueDate)}</p>
          </div>

          <div className="bg-green-50 border rounded-lg p-4">
            <FileText size={16} className="text-green-600 mb-1" />
            <p className="text-sm font-medium text-green-900">만점</p>
            <p className="text-green-800">{assignment.maxScore}점</p>
          </div>

          <div className="bg-purple-50 border rounded-lg p-4">
            <Users size={16} className="text-purple-600 mb-1" />
            <p className="text-sm font-medium text-purple-900">제출 현황</p>
            <p className="text-purple-800">{assignment.submissionCount || 0}명 제출</p>
          </div>

          {currentUser.userType === 'LEARNER' && mySubmission?.isGraded && (
            <div className="bg-yellow-50 border rounded-lg p-4">
              <Star size={16} className="text-yellow-600 mb-1" />
              <p className="text-sm font-medium text-yellow-900">내 점수</p>
              <p className="text-yellow-800 font-bold">
                {mySubmission.score}점 / {assignment.maxScore}점
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 학습자 제출 현황 */}
      {currentUser.userType === 'LEARNER' && (
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">내 제출 현황</h3>
          {mySubmission ? (
            <div className="space-y-6">
              {/* 제출 완료 카드 */}
              <div className="flex items-center justify-between p-4 bg-green-50 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle size={22} className="text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">제출 완료</p>
                    <p className="text-sm text-green-600">
                      {formatDate(mySubmission.submittedAt)}
                      {mySubmission.isLate && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded">지각</span>
                      )}
                    </p>
                  </div>
                </div>
                {!assignment.isOverdue && (
                  <button
                    onClick={() => setShowSubmissionForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow hover:opacity-90 transition"
                  >
                    재제출하기
                  </button>
                )}
              </div>

              {/* 제출한 답안/파일 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">제출한 내용</h4>
                {mySubmission.submissionText && (
                  <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 font-medium mb-2">텍스트 답안</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{mySubmission.submissionText}</p>
                  </div>
                )}
                {mySubmission.fileUrl && (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-medium mb-2">첨부파일</p>
                    <button
                      onClick={() => window.open(mySubmission.fileUrl, '_blank')}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition"
                    >
                      <Download size={16} className="mr-1" /> 제출 파일 다운로드
                    </button>
                  </div>
                )}
              </div>

              {/* 채점 결과 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">채점 결과</h4>
                {mySubmission.isGraded ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-900">획득 점수</span>
                        <span className="text-xs text-blue-600">{formatDate(mySubmission.gradedAt)}</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {mySubmission.score} / {assignment.maxScore}
                      </p>
                    </div>
                    {mySubmission.feedback ? (
                      <div className="bg-yellow-50 border rounded-lg p-4">
                        <h5 className="font-medium text-yellow-900 mb-2">교육자 피드백</h5>
                        <p className="text-gray-800 whitespace-pre-wrap">{mySubmission.feedback}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border rounded-lg p-4 text-gray-500 text-center">
                        아직 피드백이 작성되지 않았습니다.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border rounded-lg p-4 flex items-center space-x-2">
                    <Clock size={20} className="text-yellow-600" />
                    <p className="text-yellow-700">채점 대기 중</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-xl p-8 text-center">
              <FileText size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">아직 과제를 제출하지 않았습니다.</p>
              {!assignment.isOverdue ? (
                <button
                  onClick={() => setShowSubmissionForm(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition font-medium"
                >
                  과제 제출하기
                </button>
              ) : (
                <div className="bg-red-50 border rounded-lg p-4 mt-4">
                  <AlertCircle size={20} className="mx-auto text-red-500 mb-2" />
                  <p className="text-red-600 font-medium">과제 마감일이 지났습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 교육자 제출물 관리 */}
      {currentUser.userType === 'EDUCATOR' && (
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제출물 관리</h3>
          <SubmissionList
            submissions={assignmentData.submissions || []}
            assignment={assignment}
            onGradeSubmission={(submission) => {
              setSelectedSubmission(submission);
              setShowGradingPanel(true);
            }}
          />
        </div>
      )}

      {showGradingPanel && selectedSubmission && (
        <GradingPanel
          submission={selectedSubmission}
          assignment={assignment}
          onSubmit={handleGradeSubmission}
          onClose={() => {
            setShowGradingPanel(false);
            setSelectedSubmission(null);
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default AssignmentDetail;