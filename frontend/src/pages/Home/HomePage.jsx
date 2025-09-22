import React, { useState } from 'react';
import { Home, Calendar, Settings, Users, BookOpen, ClipboardList, HelpCircle, MessageSquare } from 'lucide-react';
import ClassroomCard, { CreateClassroomCard } from '../../components/ui/ClassroomCard';

const HomePage = ({ 
  currentUser, 
  classrooms, 
  onClassroomSelect, 
  onCreateClassroom,
  onJoinClassroom 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: Home, label: '대시보드' },
    { id: 'calendar', icon: Calendar, label: '일정' },
    { id: 'settings', icon: Settings, label: '설정' }
  ];

  const recentActivities = [
    { id: 1, type: 'assignment', title: '새로운 과제가 등록되었습니다', description: 'React Hook 실습 과제 - 마감일: 2024년 12월 25일', time: '2시간 전' },
    { id: 2, type: 'comment', title: '새로운 댓글', description: '김학생님이 질문에 답변을 달았습니다', time: '4시간 전' },
    { id: 3, type: 'quiz', title: '퀴즈 결과', description: 'JavaScript 기초 퀴즈 - 평균 점수: 87점', time: '1일 전' },
    { id: 4, type: 'lesson', title: '새 수업 업로드', description: 'TypeScript 기초 강의가 업로드되었습니다', time: '2일 전' }
  ];

  const getActivityIcon = (type) => {
    const iconMap = {
      assignment: { icon: <ClipboardList size={18} />, bgColor: 'bg-blue-500' },
      comment: { icon: <MessageSquare size={18} />, bgColor: 'bg-green-500' },
      quiz: { icon: <HelpCircle size={18} />, bgColor: 'bg-red-500' },
      lesson: { icon: <BookOpen size={18} />, bgColor: 'bg-purple-500' },
      grade: { icon: <Users size={18} />, bgColor: 'bg-yellow-500' },
      announcement: { icon: <MessageSquare size={18} />, bgColor: 'bg-cyan-500' }
    };
    return iconMap[type] || { icon: <Home size={18} />, bgColor: 'bg-gray-400' };
  };

  const stats = [
    { title: '참여 클래스룸', value: classrooms?.length || 0, icon: '📚', change: '+2', trend: 'up' },
    { title: '완료한 과제', value: '12', icon: '✅', change: '+3', trend: 'up' },
    { title: '평균 점수', value: '87점', icon: '🎯', change: '+5점', trend: 'up' },
    { title: '학습 시간', value: '24시간', icon: '⏰', change: '+2시간', trend: 'up' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static top-0 left-0 h-full w-72 p-6 bg-white border-r border-gray-200 transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-blue-600">EDDIE</h1>
          <p className="text-sm text-gray-500">Modern Learning Platform</p>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <IconComponent size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-8">
          <div className="p-4 rounded-xl bg-gray-100 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <div className="font-semibold">{currentUser?.userName || '사용자'}</div>
                <div className="text-xs text-gray-500">온라인</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        {/* Header */}
        <header className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              ☰
            </button>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">대시보드</h2>
              <p className="text-gray-500 text-sm">오늘도 좋은 하루 되세요!</p>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <input
              type="text"
              placeholder="검색..."
              className="pl-3 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      {stat.change} <span className="ml-2 text-gray-400">이번 주</span>
                    </div>
                  </div>
                  <div className="text-3xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Classrooms Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">내 클래스룸</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CreateClassroomCard
                  onCreateClassroom={onCreateClassroom}
                  onJoinClassroom={onJoinClassroom}
                />
                {classrooms?.map((classroom, index) => (
                  <ClassroomCard
                    key={classroom.id}
                    classroom={classroom}
                    onEnter={() => onClassroomSelect(classroom)}
                    currentUser={currentUser}
                    delay={index * 100}
                  />
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div>
              <h3 className="text-xl font-semibold mb-6">최근 활동</h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const { icon, bgColor } = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center text-white`}>
                        {icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium truncate">{activity.title}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                      </div>
                      <div className="text-xs text-gray-400">{activity.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;