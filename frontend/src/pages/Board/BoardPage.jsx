import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import SearchBar from './SearchBar';
import PostList from './PostList';
import PostForm from './PostForm';
import PostDetail from './PostDetail';
import boardService from '../../services/boardService';

const BoardPage = ({ classroomId, currentUser, accessToken }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusSearch, setFocusSearch] = useState(false);

  const loadPosts = async (search = '') => {
    if (!classroomId || !accessToken) return;
    try {
      setIsLoading(true);
      const postList = await boardService.getPosts(classroomId, search, accessToken);
      setPosts(postList);
    } catch (error) {
      console.error('게시글 목록 로드 실패:', error);
      alert('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId && accessToken) {
      loadPosts();
    }
  }, [classroomId, accessToken]);

  const handleSearch = (search) => {
    setSearchTerm(search);
    loadPosts(search);
  };

  const handlePostClick = async (post) => {
    try {
      const fullPost = await boardService.getPost(classroomId, post.postId, accessToken);
      setSelectedPost(fullPost);
      setFocusSearch(false);
    } catch (error) {
      console.error('게시글 상세 로드 실패:', error);
      alert('게시글을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmitPost = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingPost) {
        await boardService.updatePost(
          classroomId,
          editingPost.postId,
          currentUser.userId,
          formData,
          accessToken
        );
      } else {
        await boardService.createPost(
          classroomId,
          currentUser.userId,
          formData,
          accessToken
        );
      }
      await loadPosts(searchTerm);
      setShowForm(false);
      setEditingPost(null);
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      alert('게시글 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await boardService.deletePost(classroomId, postId, currentUser.userId, accessToken);
      await loadPosts(searchTerm);
      if (selectedPost && selectedPost.postId === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  if (!classroomId) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500">클래스룸을 선택해주세요.</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  // flex 비율 상태
  let leftFlex = 1;
  let rightFlex = 2;

  if (focusSearch) {
    leftFlex = 2;
    rightFlex = 1;
  } else if (selectedPost || showForm) {
    leftFlex = 1;
    rightFlex = 3; // 오른쪽 확장, 왼쪽 축소
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-1 gap-6 transition-all duration-500 ease-in-out">
        {/* 왼쪽: 검색 + 버튼 + 목록 */}
        <div
          style={{ flex: leftFlex }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-y-auto transition-all duration-500 ease-in-out"
        >
          {/* 검색 + 버튼 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onFocus={() => setFocusSearch(true)}
                onBlur={() => setFocusSearch(false)}
              />
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="ml-2 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow hover:opacity-90 transition"
            >
              <Plus size={18} />
              <span>글</span>
            </button>
          </div>

          {/* 게시글 목록 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-500">게시글 불러오는 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-gray-400 py-10">아직 작성된 글이 없습니다.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {posts.map((post) => (
                <div
                  key={post.postId}
                  onClick={() => handlePostClick(post)}
                  className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 hover:shadow transition"
                >
                  <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 상세보기 / 작성폼 */}
        <div
          style={{ flex: rightFlex }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-y-auto transition-all duration-500 ease-in-out"
        >
          {selectedPost ? (
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
              accessToken={accessToken}
            />
          ) : showForm ? (
            <PostForm
              onSubmit={handleSubmitPost}
              onCancel={() => {
                setShowForm(false);
                setEditingPost(null);
              }}
              initialData={editingPost}
              isLoading={isSubmitting}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              게시글을 선택하거나 새 글을 작성해보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardPage;