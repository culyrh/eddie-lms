import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from './TopNavBar';

const Layout = ({ children, showTopNav = true }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 사용자 정보 로드
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      // 실제 구현에서는 API 호출
      const response = await fetch('/api/users/me', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // 인증 실패 시 로그인 페이지로 리다이렉트
        navigate('/login');
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      // 임시 더미 데이터 (개발 시에만 사용)
      setUser({
        userId: 1,
        name: '김철수',
        email: 'kimcs@example.com',
        profileImageUrl: null,
        userType: 'LEARNER',
        isActive: true,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-08-20T14:30:00Z'
      });
    }
  };

  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('token');
      
      // 사용자 상태 초기화
      setUser(null);
      
      // 로그인 페이지로 리다이렉트
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 있어도 강제 로그아웃
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  const handleUpdateProfile = async (updateData) => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        return updatedUser;
      } else {
        throw new Error('프로필 업데이트 실패');
      }
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showTopNav && user && (
        <TopNavBar 
          user={user} 
          onLogout={handleLogout}
        />
      )}
      
      <main className={showTopNav ? '' : 'pt-0'}>
        {React.cloneElement(children, { 
          user, 
          onUpdateProfile: handleUpdateProfile,
          onReloadUser: loadUserInfo
        })}
      </main>
    </div>
  );
};

export default Layout;