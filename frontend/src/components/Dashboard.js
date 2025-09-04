import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Plus, Search } from 'lucide-react';
// 기존 App.js에서 사용하는 api 객체를 import (만약 분리되어 있다면)
// import api from '../services/api'; // 실제 api 객체 경로

const Dashboard = ({ user, accessToken }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && accessToken) {
      loadClassrooms();
    }
  }, [user, accessToken]);

  // ============================================================================
  // 기존 App.js와 동일한 방식으로 API 호출 (Mock 데이터 제거)
  // ============================================================================
  const loadClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 클래스룸 목록 조회 시작: userId=${user.userId}`);
      
      // 기존 App.js에서 사용하는 방식과 동일하게 API 호출
      const response = await fetch(`http://localhost:8080/api/classrooms/my-classrooms?userId=${user.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        } else if (response.status === 403) {
          throw new Error('접근 권한이 없습니다.');
        } else if (response.status === 404) {
          throw new Error('클래스룸을 찾을 수 없습니다.');
        }
        throw new Error(`HTTP ${response.status}: 클래스룸 목록을 불러올 수 없습니다.`);
      }
      
      const data = await response.json();
      console.log('✅ 클래스룸 목록 조회 성공:', data);
      setClassrooms(data);
      
    } catch (error) {
      console.error('❌ 클래스룸 로드 실패:', error);
      setError(error.message || '클래스룸 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomClick = (classroomId) => {
    navigate(`/classroom/${classroomId}`);
  };

  const handleCreateClassroom = () => {
    // 클래스룸 생성 모달 또는 페이지로 이동
    console.log('클래스룸 생성');
  };

  // ============================================================================
  // 로딩 및 에러 상태 렌더링
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-gray-600">클래스룸 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={loadClassrooms}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 메인 렌더링
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            안녕하세요, {user?.name}님! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.userType === 'EDUCATOR' 
              ? '오늘도 멋진 수업을 진행해보세요.'
              : '오늘도 새로운 것을 배워보세요.'
            }
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">참여 클래스룸</p>
                <p className="text-2xl font-semibold text-gray-900">{classrooms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 멤버</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classrooms.reduce((sum, classroom) => sum + (classroom.memberCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">이번 주 과제</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classrooms.reduce((sum, classroom) => sum + (classroom.weeklyAssignments || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 클래스룸 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.userType === 'EDUCATOR' ? '내 클래스룸' : '참여 중인 클래스룸'}
              </h2>
              <div className="flex space-x-3">
                {/* 검색 */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="클래스룸 검색..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                {/* 클래스룸 생성 버튼 (교육자만) */}
                {user?.userType === 'EDUCATOR' && (
                  <button
                    onClick={handleCreateClassroom}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    클래스룸 생성
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {classrooms.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  참여 중인 클래스룸이 없습니다
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {user?.userType === 'EDUCATOR' 
                    ? '새로운 클래스룸을 생성해보세요.'
                    : '클래스룸에 참여해보세요.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map((classroom) => (
                  <div
                    key={classroom.classroomId} // 백엔드 응답 구조에 맞게 수정
                    onClick={() => handleClassroomClick(classroom.classroomId)}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {classroom.classroomName} {/* 백엔드 응답 구조에 맞게 수정 */}
                      </h3>
                      {classroom.isOwner && (
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                          관리자
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {classroom.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{classroom.memberCount || 0}명</span>
                      </div>
                      <div>
                        강사: {classroom.educatorName || '미정'}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400">
                      생성일: {new Date(classroom.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-8 w-8 mb-2" />
              <p>최근 활동 내역이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;