import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Plus, Search } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      // 실제 구현에서는 API 호출
      // const response = await fetch('/api/classrooms/my');
      // const data = await response.json();
      
      // 임시 더미 데이터
      setTimeout(() => {
        setClassrooms([
          {
            id: 1,
            name: '웹 개발 기초',
            description: 'HTML, CSS, JavaScript 기초부터 차근차근',
            instructor: '김강사',
            memberCount: 25,
            createdAt: '2024-07-15',
            isOwner: user?.userType === 'EDUCATOR'
          },
          {
            id: 2,
            name: 'React 심화 과정',
            description: 'React Hooks, Context API, 상태 관리까지',
            instructor: '이선생',
            memberCount: 18,
            createdAt: '2024-08-01',
            isOwner: false
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('클래스룸 로드 실패:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

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
                  {classrooms.reduce((sum, classroom) => sum + classroom.memberCount, 0)}
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
                <p className="text-2xl font-semibold text-gray-900">3</p>
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
                {/* 검색 (추후 구현) */}
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
                    key={classroom.id}
                    onClick={() => handleClassroomClick(classroom.id)}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {classroom.name}
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
                        <span>{classroom.memberCount}명</span>
                      </div>
                      <div>
                        강사: {classroom.instructor}
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

        {/* 최근 활동 (추후 구현) */}
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