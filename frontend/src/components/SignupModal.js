import React, { useState } from 'react';

const SignupModal = ({ isOpen, onClose, onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'LEARNER'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 2글자 이상이어야 합니다.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6글자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        userType: formData.userType
      };
      
      await onSignup(userData);
    } catch (error) {
      console.error('회원가입 실패:', error);
      setErrors({ submit: error.message || '회원가입에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">회원가입</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="이름을 입력하세요"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">사용자 유형</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              <option value="LEARNER">학생</option>
              <option value="EDUCATOR">교육자</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="비밀번호를 입력하세요 (6글자 이상)"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '회원가입 중...' : '회원가입'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;