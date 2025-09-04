import React, { useState, useRef } from 'react';
import { Camera, Save, User, Mail, Calendar, Shield, Upload, X } from 'lucide-react';

const ProfilePage = ({ user, onUpdateProfile, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    profileImageUrl: user?.profileImageUrl || ''
  });
  const [previewImage, setPreviewImage] = useState(user?.profileImageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const getDefaultProfileImage = (name) => {
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    const svg = `
      <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="150" fill="#6366f1"/>
        <text x="75" y="95" font-family="Arial, sans-serif" font-size="60" 
              font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

const defaultProfileImage = getDefaultProfileImage(user?.name);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);

    try {
      // 실제 구현에서는 여기서 파일을 서버에 업로드
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await uploadApi.uploadProfileImage(formData);
      
      // 미리보기용 로컬 URL 생성
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl);
      setFormData(prev => ({
        ...prev,
        profileImageUrl: localUrl // 실제로는 서버에서 받은 URL
      }));
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름은 필수입니다.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 2글자 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await onUpdateProfile({
        name: formData.name.trim(),
        profileImageUrl: formData.profileImageUrl
      });
      setIsEditing(false);
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      profileImageUrl: user?.profileImageUrl || ''
    });
    setPreviewImage(user?.profileImageUrl || '');
    setErrors({});
    setIsEditing(false);
  };

  const removeProfileImage = () => {
    setPreviewImage('');
    setFormData(prev => ({
      ...prev,
      profileImageUrl: ''
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getUserTypeName = (userType) => {
    return userType === 'EDUCATOR' ? '교육자' : '학습자';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={onClose}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4"
          >
            ← 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 프로필 이미지 및 기본 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                {/* 프로필 이미지 */}
                <div className="relative inline-block mb-4">
                  <img
                    src={previewImage || user?.profileImageUrl || defaultProfileImage}
                    alt="프로필"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => {
                      e.target.src = defaultProfileImage;
                    }}
                  />
                  
                  {isEditing && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Camera size={16} />
                        )}
                      </button>
                      
                      {previewImage && (
                        <button
                          onClick={removeProfileImage}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {user?.name}
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  {getUserTypeName(user?.userType)}
                </p>

                {/* 기본 정보 */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-sm">
                    <Mail size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">{user?.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      가입일: {formatDate(user?.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Shield size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      상태: {user?.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 프로필 수정 폼 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">프로필 정보</h3>
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      수정하기
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                      >
                        <Save size={16} />
                        <span>저장</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 이름 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="이름을 입력하세요"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900 py-2">{user?.name}</p>
                  )}
                </div>

                {/* 이메일 (읽기 전용) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <p className="text-gray-500 py-2">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">이메일은 변경할 수 없습니다.</p>
                </div>

                {/* 사용자 유형 (읽기 전용) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용자 유형
                  </label>
                  <p className="text-gray-500 py-2">{getUserTypeName(user?.userType)}</p>
                  <p className="text-xs text-gray-400 mt-1">사용자 유형은 변경할 수 없습니다.</p>
                </div>

                {/* 가입일 (읽기 전용) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가입일
                  </label>
                  <p className="text-gray-500 py-2">{formatDate(user?.createdAt)}</p>
                </div>

                {/* 최종 수정일 (읽기 전용) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최종 수정일
                  </label>
                  <p className="text-gray-500 py-2">{formatDate(user?.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* 활동 통계 (추후 구현) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">활동 통계</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">0</div>
                  <div className="text-sm text-gray-600">참여한 클래스룸</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">완료한 과제</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">게시글 수</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;