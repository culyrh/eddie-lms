import React from 'react';
import { Eye, MessageCircle, Clock, User, MoreVertical } from 'lucide-react';

const PostList = ({ posts, onPostClick, onDeletePost, currentUser }) => {
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

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <MessageCircle size={48} className="mx-auto" />
        </div>
        <p className="text-gray-500 text-lg">아직 게시글이 없습니다</p>
        <p className="text-gray-400 text-sm mt-2">첫 번째 게시글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem
          key={post.postId}
          post={post}
          onPostClick={onPostClick}
          onDeletePost={onDeletePost}
          currentUser={currentUser}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
};

const PostItem = ({ post, onPostClick, onDeletePost, currentUser, formatDate }) => {
  const [showOptions, setShowOptions] = React.useState(false);
  
  const isAuthor = currentUser && post.authorId === currentUser.userId;
  const isEducator = currentUser && currentUser.userType === 'EDUCATOR';
  const canDelete = isAuthor || isEducator;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      onDeletePost(post.postId);
    }
    setShowOptions(false);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={() => onPostClick(post)}
    >
      {/* 옵션 버튼 (작성자나 교육자만 표시) */}
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
        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* 내용 미리보기 */}
        {post.content && (
          <p className="text-gray-600 mb-4 line-clamp-2">
            {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}
            {post.content.length > 150 && '...'}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {/* 작성자 */}
            <div className="flex items-center space-x-1">
              <User size={14} />
              <span>{post.authorName || '익명'}</span>
              {post.authorType === 'EDUCATOR' && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  교육자
                </span>
              )}
            </div>

            {/* 작성일 */}
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 조회수 */}
            <div className="flex items-center space-x-1">
              <Eye size={14} />
              <span>{post.viewCount || 0}</span>
            </div>

            {/* 댓글 수 */}
            <div className="flex items-center space-x-1">
              <MessageCircle size={14} />
              <span>{post.commentCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 첨부파일 표시 */}
      {post.hasAttachment && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            첨부파일
          </div>
        </div>
      )}
    </div>
  );
};

// 클릭 외부 영역 감지를 위한 커스텀 훅
const useClickOutside = (ref, handler) => {
  React.useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

export default PostList;