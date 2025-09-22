import React from 'react';

/**
 * Modern Button Component for EDDIE
 * 기존 Button.jsx를 교체하는 모던 버튼 컴포넌트
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconPosition = 'left',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) => {
  // Base classes
  const baseClasses = 'btn';
  
  // Variant classes - 기존 EDDIE 프로젝트와 호환
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    success: 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/25',
    warning: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:shadow-lg hover:shadow-yellow-500/25',
    danger: 'bg-gradient-to-r from-red-400 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25',
    ghost: 'btn-ghost',
    outline: 'bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40'
  };
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    xl: 'px-10 py-5 text-lg'
  };
  
  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
  
  // Render icon based on position
  const renderIcon = (position) => {
    if (loading && position === 'left') {
      return <LoadingSpinner />;
    }
    if (icon && iconPosition === position) {
      return <span className="flex-shrink-0">{icon}</span>;
    }
    return null;
  };
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {renderIcon('left')}
      {children}
      {renderIcon('right')}
    </button>
  );
};

export default Button;