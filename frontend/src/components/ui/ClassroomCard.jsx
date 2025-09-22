import React from 'react';
import Button from '../common/Button';

/**
 * Modern ClassroomCard Component for EDDIE
 * 기존 ClassroomCard.jsx를 교체하는 모던 클래스룸 카드
 */
const ClassroomCard = ({
  classroom,
  onEnter,
  onJoin,
  currentUser,
  delay = 0,
  className = ''
}) => {
  if (!classroom) return null;

  // 상태별 색상 설정
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
      case '진행중': 
        return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'SCHEDULED':
      case '예정': 
        return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'COMPLETED':
      case '완료': 
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
      case 'PAUSED':
      case '일시정지':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      default: 
        return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
    }
  };

  // 상태별 텍스트 설정
  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '진행중';
      case 'SCHEDULED': return '예정';
      case 'COMPLETED': return '완료';
      case 'PAUSED': return '일시정지';
      default: return status;
    }
  };

  // 진행률에 따른 그라데이션
  const getProgressGradient = (progress = 0) => {
    if (progress >= 80) return 'from-green-400 to-blue-500';
    if (progress >= 50) return 'from-blue-400 to-purple-500';
    if (progress >= 25) return 'from-purple-400 to-pink-500';
    return 'from-pink-400 to-red-400';
  };

  // 액션 버튼 설정
  const getActionButton = () => {
    const isParticipant = classroom.participants?.some(p => p.userId === currentUser?.userId);
    const isEducator = classroom.educatorId === currentUser?.userId;

    if (isEducator || isParticipant) {
      switch (classroom.status) {
        case 'ACTIVE':
          return {
            variant: 'primary',
            icon: '📖',
            text: '강의실 입장',
            onClick: onEnter
          };
        case 'SCHEDULED':
          return {
            variant: 'secondary',
            icon: '⏰',
            text: '준비 중',
            onClick: onEnter
          };
        case 'COMPLETED':
          return {
            variant: 'ghost',
            icon: '📊',
            text: '결과 보기',
            onClick: onEnter
          };
        default:
          return {
            variant: 'accent',
            icon: '🚀',
            text: '시작하기',
            onClick: onEnter
          };
      }
    } else {
      return {
        variant: 'accent',
        icon: '➕',
        text: '참여하기',
        onClick: onJoin
      };
    }
  };

  const actionButton = getActionButton();
  const memberCount = classroom.participants?.length || 0;

  return (
    <div 
      className={`glass-card p-6 animate-slide-up ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="heading-md text-white truncate">
          {classroom.classroomName || classroom.title}
        </h3>
        <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(classroom.status)}`}>
          {getStatusText(classroom.status)}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">
        {classroom.description || '클래스룸에 대한 설명이 없습니다.'}
      </p>
      
      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center space-x-2 text-white/60">
          <span className="text-base">👥</span>
          <span>{memberCount}명</span>
        </div>
        <div className="flex items-center space-x-2 text-white/60">
          <span className="text-base">📅</span>
          <span>{classroom.schedule || '일정 미정'}</span>
        </div>
        {classroom.category && (
          <div className="flex items-center space-x-2 text-white/60">
            <span className="text-base">📚</span>
            <span>{classroom.category}</span>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      {typeof classroom.progress === 'number' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/60">진행률</span>
            <span className="text-xs text-white/80 font-medium">{classroom.progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill bg-gradient-to-r ${getProgressGradient(classroom.progress)}`}
              style={{ width: `${classroom.progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Action Button */}
      <Button 
        variant={actionButton.variant}
        fullWidth
        icon={actionButton.icon}
        onClick={actionButton.onClick}
        className="mt-4"
      >
        {actionButton.text}
      </Button>
      
      {/* Educator Info */}
      {classroom.educatorName && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center text-xs text-white/50">
            <span className="mr-1">👨‍🏫</span>
            <span>강사: {classroom.educatorName}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Create New Classroom Card
 */
const CreateClassroomCard = ({ 
  onClick,
  className = '',
  delay = 0
}) => {
  return (
    <div 
      className={`glass-card p-6 border-2 border-dashed border-white/20 hover:border-purple-400/50 transition-colors cursor-pointer text-center animate-slide-up ${className}`}
      onClick={onClick}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4 text-2xl animate-pulse">
          ➕
        </div>
        <h3 className="heading-md mb-2 text-white">새 클래스룸 만들기</h3>
        <p className="text-white/70 mb-4 text-sm">새로운 학습 공간을 시작해보세요</p>
        <Button variant="accent" icon="🚀">
          시작하기
        </Button>
      </div>
    </div>
  );
};

export default ClassroomCard;
export { CreateClassroomCard };