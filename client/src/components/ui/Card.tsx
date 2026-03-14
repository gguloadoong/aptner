import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// 공통 카드 컴포넌트
const Card = React.memo<CardProps>(
  ({ children, className = '', onClick, hoverable = false, padding = 'md' }) => {
    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        className={[
          'bg-white rounded-xl border border-[#E5E8EB] shadow-sm',
          paddingStyles[padding],
          hoverable
            ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#1B64DA]/30 active:scale-[0.99]'
            : '',
          className,
        ].join(' ')}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
