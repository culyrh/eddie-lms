import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import SearchBar from './SearchBar';
import PostList from './PostList';
import PostForm from './PostForm';
import PostDetail from './PostDetail';
import boardService from '../../services/boardService';

const BoardPage = ({ classroomId, currentUser, accessToken }) => { // ✅ accessToken props 추가
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 게시글 목록 로드 (✅ 토큰 전달)
  const loadPosts = async (search = '') => {
    if (!classroomId || !accessToken) return;
    
    try {
      setIsLoading(true);
      const postList = await boardService.getPosts(classroomId, search, accessToken); // ✅ 토큰 추가
      setPosts(postList);
    } catch (error) {
      console.error('게시글 목록 로드 실패:', error);
      alert('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (classroomId && accessToken) {
      loadPosts();
    }
  }, [classroomId, accessToken]);

  // 검색 핸들러
  const handleSearch = (search) => {
    setSearchTerm(search);
    loadPosts(search);
  };

  // 게시글 클릭 핸들러 (✅ 토큰 전달)
  const handlePostClick = async (post) => {
    try {
      const fullPost = await boardService.getPost(classroomId, post.postId, accessToken); // ✅ 토큰 추가
      setSelectedPost(fullPost);
    } catch (error) {
      console.error('게시글 상세 로드 실패:', error);
      alert('게시글을 불러오는데 실패했습니다.');
    }
  };

  // 게시글 작성/수정 핸들러 (✅ 토큰 전달)
  const handleSubmitPost = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingPost) {
        // 수정
        await boardService.updatePost(
          classroomId, 
          editingPost.postId, 
          currentUser.userId, 
          formData,
          accessToken // ✅ 토큰 추가
        );
      } else {
        // 새 작성
        await boardService.createPost(
          classroomId, 
          currentUser.userId, 
          formData,
          accessToken // ✅ 토큰 추가
        );
      }
      
      // 목록 새로고침
      await loadPosts(searchTerm);
      
      // 폼 닫기
      setShowForm(false);
      setEditingPost(null);
      
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      alert('게시글 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 게시글 삭제 핸들러 (✅ 토큰 전달)
  const handleDeletePost = async (postId) => {
    try {
      await boardService.deletePost(classroomId, postId, currentUser.userId, accessToken); // ✅ 토큰 추가
      
      // 목록에서 제거
      await loadPosts(searchTerm);
      
      // 상세보기에서 삭제된 경우 목록으로 이동
      if (selectedPost && selectedPost.postId === postId) {
        setSelectedPost(null);
      }
      
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
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

  // 토큰이 없는 경우
  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  // 게시글 상세 보기
  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onEdit={() => {
          setEditingPost(selectedPost);
          setSelectedPost(null);
          setShowForm(true);
        }}
        onDelete={handleDeletePost}
        currentUser={currentUser}
        classroomId={classroomId}
        accessToken={accessToken} // ✅ 토큰 전달
      />
    );
  }

  // 게시글 작성/수정 폼
  if (showForm) {
    return (
      <PostForm
        onSubmit={handleSubmitPost}
        onCancel={() => {
          setShowForm(false);
          setEditingPost(null);
        }}
        initialData={editingPost}
        isLoading={isSubmitting}
      />
    );
  }

  // 게시글 목록 (기본 화면)
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">게시판</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          <span>글 작성</span>
        </button>
      </div>

      {/* 검색바 */}
      <SearchBar
        onSearch={handleSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500">게시글을 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <PostList
          posts={posts}
          onPostClick={handlePostClick}
          onDeletePost={handleDeletePost}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default BoardPage;