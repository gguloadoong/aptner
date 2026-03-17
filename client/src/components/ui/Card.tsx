import React from 'react';
import { Box } from '@wanteddev/wds';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  sx?: Record<string, string | number>;
}

// 공통 카드 컴포넌트 — WDS Box 기반
const Card = React.memo<CardProps>(
  ({ children, onClick, hoverable = false, padding = 'md', sx }) => {
    const paddingMap = {
      none: '0',
      sm: '12px',
      md: '16px',
      lg: '24px',
    };

    return (
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRadius: '12px',
          border: '1px solid var(--semantic-line-normal)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: paddingMap[padding],
          cursor: onClick ? 'pointer' : undefined,
          transition: hoverable ? 'box-shadow 200ms ease, border-color 200ms ease' : undefined,
          ...sx,
        }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e: React.KeyboardEvent) => e.key === 'Enter' && onClick() : undefined}
        onMouseEnter={hoverable && onClick ? (e: React.MouseEvent) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          el.style.borderColor = 'rgba(0,102,255,0.3)';
        } : undefined}
        onMouseLeave={hoverable && onClick ? (e: React.MouseEvent) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
          el.style.borderColor = 'var(--semantic-line-normal)';
        } : undefined}
      >
        {children}
      </Box>
    );
  }
);

Card.displayName = 'Card';
export default Card;
