import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

// 상태 뱃지 컴포넌트
const Badge = React.memo<BadgeProps>(
  ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
    const variantStyles = {
      primary: 'bg-blue-50 text-blue-600',
      success: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-orange-100 text-orange-700',
      danger: 'bg-red-100 text-[#FF4B4B]',
      neutral: 'bg-gray-100 text-[#8B95A1]',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    return (
      <span
        className={[
          'inline-flex items-center font-semibold rounded-full',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
export default Badge;
