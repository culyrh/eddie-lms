import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Bell } from 'lucide-react';

const TopNavBar = ({ user, onLogout, onProfileClick }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileButtonClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleMyPageClick = () => {
    onProfileClick();
    setIsProfileDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsProfileDropdownOpen(false);
  };

  const defaultProfileImage = "https://via.placeholder.com/40x40/6366f1/ffffff?text=" + 
    (user?.name ? user.name.charAt(0).toUpperCase() : 'U');

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-indigo-600">
              EDDIE
            </div>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 알림 아이콘 (추후 구현) */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
            </button>

            {/* 프로필 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleProfileButtonClick}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <img
                  src={user?.profileImageUrl || defaultProfileImage}
                  alt="프로필"
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.src = defaultProfileImage;
                  }}
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.name || '사용자'}
                </span>
              </button>

              {/* 드롭다운 메뉴 */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  {/* 사용자 정보 */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user?.profileImageUrl || defaultProfileImage}
                        alt="프로필"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = defaultProfileImage;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || '사용자'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user?.userType === 'EDUCATOR' ? '교육자' : '학습자'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 메뉴 항목들 */}
                  <div className="py-1">
                    <button
                      onClick={handleMyPageClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User size={16} className="mr-3" />
                      마이페이지
                    </button>
                    
                    <button
                      onClick={handleMyPageClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings size={16} className="mr-3" />
                      설정
                    </button>
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="mr-3" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavBar;