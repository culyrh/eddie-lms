import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, User, Clock } from 'lucide-react';
import boardService from '../../services/boardService';

const CommentSection = ({ postId, classroomId, currentUser, accessToken }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 댓글 목록 로드
  const loadComments = async () => {
    try {
      setIsLoading(true);
      // 게시글 상세 조회 시 댓글도 함께 로드된다고 가정
      // 실제로는 별도의 댓글 조회 API가 필요할 수 있음
      const postData = await boardService.getPost(classroomId, postId, accessToken);
      setComments(postData.comments || []);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId && classroomId && accessToken) {
      loadComments();
    }
  }, [postId, classroomId, accessToken]);

  // 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await boardService.createComment(
        classroomId,
        postId,
        currentUser.userId,
        newComment.trim(),
        accessToken
      );
      
      setNewComment('');
      await loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await boardService.deleteComment(
        classroomId,
        postId,
        commentId,
        currentUser.userId,
        accessToken
      );
      
      await loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays - 1}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* 댓글 헤더 */}
      <div className="flex items-center space-x-2">
        <MessageCircle size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          댓글 ({comments.length})
        </h3>
      </div>

      {/* 댓글 작성 폼 */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? '작성 중...' : '댓글 작성'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">댓글을 불러오는 중...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">아직 댓글이 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              currentUser={currentUser}
              onDelete={handleDeleteComment}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  );
};

const CommentItem = ({ comment, currentUser, onDelete, formatDate }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isAuthor = currentUser && comment.authorId === currentUser.userId;
  const isEducator = currentUser && currentUser.userType === 'EDUCATOR';
  const canDelete = isAuthor || isEducator;

  return (
    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
      {/* 프로필 아이콘 */}
      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-white" />
      </div>

      {/* 댓글 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">
              {comment.authorName || '익명'}
            </span>
            {comment.authorType === 'EDUCATOR' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                교육자
              </span>
            )}
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock size={12} />
              <span>{formatDate(comment.createdAt)}</span>
            </div>
          </div>

          {/* 삭제 버튼 */}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.commentId)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="댓글 삭제"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-gray-800 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
};

export default CommentSection;