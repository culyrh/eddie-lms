import React from 'react';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Star, Users, MoreVertical } from 'lucide-react';

const AssignmentList = ({ assignments, onAssignmentClick, onDeleteAssignment, currentUser }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: '마감됨', color: 'text-red-600', urgent: true };
    } else if (diffDays === 0) {
      return { text: '오늘 마감', color: 'text-orange-600', urgent: true };
    } else if (diffDays === 1) {
      return { text: '내일 마감', color: 'text-orange-500', urgent: true };
    } else if (diffDays <= 3) {
      return { text: `${diffDays}일 남음`, color: 'text-yellow-600', urgent: false };
    } else {
      return { text: `${diffDays}일 남음`, color: 'text-green-600', urgent: false };
    }
  };

  const getSubmissionStatus = (assignment) => {
    if (!assignment.mySubmission) {
      return {
        icon: AlertCircle,
        text: '미제출',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
    
    if (assignment.mySubmission.isGraded) {
      return {
        icon: Star,
        text: `${assignment.mySubmission.score}점`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }
    
    return {
      icon: CheckCircle,
      text: '채점 대기',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    };
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <FileText size={48} className="mx-auto" />
        </div>
        <p className="text-gray-500 text-lg">등록된 과제가 없습니다</p>
        <p className="text-gray-400 text-sm mt-2">
          {currentUser.userType === 'EDUCATOR' 
            ? '첫 번째 과제를 등록해보세요!' 
            : '교육자가 과제를 등록할 때까지 기다려주세요.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <AssignmentItem
          key={assignment.assignmentId}
          assignment={assignment}
          onAssignmentClick={onAssignmentClick}
          onDeleteAssignment={onDeleteAssignment}
          currentUser={currentUser}
          formatDate={formatDate}
          getSubmissionStatus={getSubmissionStatus}
        />
      ))}
    </div>
  );
};

const AssignmentItem = ({ 
  assignment, 
  onAssignmentClick, 
  onDeleteAssignment, 
  currentUser, 
  formatDate, 
  getSubmissionStatus 
}) => {
  const [showOptions, setShowOptions] = React.useState(false);
  
  const isCreator = currentUser && assignment.creatorId === currentUser.userId;
  const isEducator = currentUser && currentUser.userType === 'EDUCATOR';
  const canDelete = isCreator || isEducator;

  const dueDateInfo = formatDate(assignment.dueDate);
  const submissionStatus = currentUser.userType === 'LEARNER' ? getSubmissionStatus(assignment) : null;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm('정말 이 과제를 삭제하시겠습니까?')) {
      onDeleteAssignment(assignment.assignmentId);
    }
    setShowOptions(false);
  };

  return (
    <div 
      className={`bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer relative p-6 ${
        dueDateInfo.urgent ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-200'
      }`}
      onClick={() => onAssignmentClick(assignment)}
    >
      {/* 옵션 버튼 (교육자만 표시) */}
      {canDelete && (
        <div className="absolute top-4 right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
          
          {showOptions && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[100px]">
              <button
                onClick={handleDeleteClick}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      <div className="pr-8">
        {/* 과제 제목과 상태 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {assignment.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {assignment.description}
            </p>
          </div>
          
          {/* 학생: 제출 상태 표시 */}
          {currentUser.userType === 'LEARNER' && submissionStatus && (
            <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
              submissionStatus.bgColor
            } ${submissionStatus.color} ${submissionStatus.borderColor} border`}>
              <div className="flex items-center space-x-1">
                <submissionStatus.icon size={12} />
                <span>{submissionStatus.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-500">
            {/* 마감일 */}
            <div className={`flex items-center space-x-1 ${dueDateInfo.color}`}>
              <Clock size={14} />
              <span className={dueDateInfo.urgent ? 'font-medium' : ''}>
                {dueDateInfo.text}
              </span>
            </div>

            {/* 만점 */}
            <div className="flex items-center space-x-1">
              <Star size={14} />
              <span>{assignment.maxScore}점</span>
            </div>

            {/* 등록일 */}
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>
                {new Date(assignment.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>

          {/* 교육자: 제출 현황 */}
          {currentUser.userType === 'EDUCATOR' && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Users size={14} />
              <span>{assignment.submissionCount || 0}명 제출</span>
            </div>
          )}
        </div>

        {/* 학생: 추가 정보 */}
        {currentUser.userType === 'LEARNER' && assignment.mySubmission && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                제출일: {new Date(assignment.mySubmission.submittedAt).toLocaleDateString('ko-KR')}
              </span>
              {assignment.mySubmission.isGraded && assignment.mySubmission.feedback && (
                <span className="text-blue-600 font-medium">피드백 있음</span>
              )}
            </div>
          </div>
        )}

        {/* 긴급 표시 */}
        {dueDateInfo.urgent && (
          <div className="mt-3 pt-3 border-t border-orange-100">
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertCircle size={14} />
              <span className="text-xs font-medium">
                {dueDateInfo.text === '마감됨' ? '마감된 과제입니다' : '마감 임박!'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentList;