import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Eye, Clock, User, Download, Pin } from 'lucide-react';
import CommentSection from './CommentSection';

const PostDetail = ({ 
  post, 
  onBack, 
  onEdit, 
  onDelete, 
  currentUser, 
  classroomId, 
  accessToken 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isAuthor = currentUser && post.authorId === currentUser.userId;
  const isEducator = currentUser && currentUser.userType === 'EDUCATOR';
  const canEdit = isAuthor;
  const canDelete = isAuthor || isEducator;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(post.postId);
      onBack();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadAttachment = (attachment) => {
    // 실제 구현에서는 백엔드에서 파일 다운로드 API를 호출
    console.log('파일 다운로드:', attachment);
    // TODO: 파일 다운로드 로직 구현
  };

  const getFileIcon = (fileType) => {
    if (fileType && fileType.startsWith('image/')) return '🖼️';
    if (fileType && fileType.includes('pdf')) return '📄';
    if (fileType && fileType.includes('word')) return '📝';
    if (fileType && fileType.includes('excel') || fileType && fileType.includes('spreadsheet')) return '📊';
    if (fileType && fileType.includes('powerpoint') || fileType && fileType.includes('presentation')) return '📺';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">게시글</h2>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              onClick={onEdit}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit size={16} />
              <span>수정</span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 게시글 내용 */}
      <div className="p-6">
        {/* 고정 표시 */}
        {post.isPinned && (
          <div className="flex items-center space-x-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Pin size={16} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">상단 고정된 게시글</span>
          </div>
        )}

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            {/* 작성자 */}
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span className="font-medium">{post.authorName || '익명'}</span>
              {post.authorType === 'EDUCATOR' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  교육자
                </span>
              )}
            </div>

            {/* 작성일 */}
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>{formatDate(post.createdAt)}</span>
            </div>

            {/* 수정일 (있는 경우) */}
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <div className="flex items-center space-x-1 text-gray-500">
                <span>·</span>
                <span>수정됨 {formatDate(post.updatedAt)}</span>
              </div>
            )}
          </div>

          {/* 조회수 */}
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Eye size={16} />
            <span>조회 {post.viewCount || 0}</span>
          </div>
        </div>

        {/* 본문 내용 */}
        <div className="prose prose-lg max-w-none mb-8">
          <div 
            className="text-gray-900 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: post.content ? post.content.replace(/\n/g, '<br>') : '' 
            }}
          />
        </div>

        {/* 첨부파일 */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Download size={18} className="mr-2" />
              첨부파일 ({post.attachments.length})
            </h3>
            <div className="space-y-2">
              {post.attachments.map((attachment, index) => (
                <div
                  key={attachment.id || index}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getFileIcon(attachment.type)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {attachment.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadAttachment(attachment)}
                    className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    <span>다운로드</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 댓글 섹션 */}
        <div className="border-t border-gray-200 pt-8">
          <CommentSection
            postId={post.postId}
            classroomId={classroomId}
            currentUser={currentUser}
            accessToken={accessToken}
          />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;