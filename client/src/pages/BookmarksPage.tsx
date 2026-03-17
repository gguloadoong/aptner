// 찜한 단지 목록 페이지
import { useNavigate } from 'react-router-dom';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useApartmentDetail } from '../hooks/useApartment';
import { formatPriceShort, formatChange } from '../utils/formatNumber';
import {
  Box, FlexBox, Typography, Skeleton,
  TopNavigation, TopNavigationButton,
} from '@wanteddev/wds';
import { IconChevronLeft } from '@wanteddev/wds-icon';

// 단일 찜 단지 카드
function BookmarkCard({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data: apartment, isLoading, isError } = useApartmentDetail(id);

  if (isLoading) {
    return (
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRadius: '12px',
          border: '1px solid var(--semantic-line-normal)',
          padding: '16px',
        }}
      >
        <Skeleton variant="rectangle" width="100%" height="48px" />
      </Box>
    );
  }

  if (isError || !apartment) {
    return (
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRadius: '12px',
          border: '1px solid var(--semantic-line-normal)',
          padding: '16px',
        }}
      >
        <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>{id}</Typography>
      </Box>
    );
  }

  const priceColor =
    apartment.priceChangeType === 'up'
      ? '#FF4B4B'
      : apartment.priceChangeType === 'down'
        ? '#3B82F6'
        : 'var(--semantic-label-assistive)';
  const priceArrow =
    apartment.priceChangeType === 'up' ? '▲' : apartment.priceChangeType === 'down' ? '▼' : '';

  return (
    <button
      onClick={() => navigate(`/apartment/${apartment.id}`)}
      style={{
        width: '100%',
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '12px',
        border: '1px solid var(--semantic-line-normal)',
        padding: '16px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'box-shadow 200ms ease, border-color 200ms ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        el.style.borderColor = 'rgba(0,102,255,0.3)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        el.style.borderColor = 'var(--semantic-line-normal)';
      }}
    >
      <FlexBox alignItems="center" justifyContent="space-between">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            weight="bold"
            sx={{ color: 'var(--semantic-label-normal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {apartment.name}
          </Typography>
          <Typography
            variant="caption1"
            sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {apartment.address || `${apartment.district} ${apartment.dong}`}
          </Typography>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '16px' }}>
          <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
            {formatPriceShort(apartment.recentPrice)}
          </Typography>
          <Typography variant="caption1" weight="medium" sx={{ color: priceColor, display: 'block', marginTop: '2px' }}>
            {priceArrow} {formatChange(apartment.priceChange)}
          </Typography>
        </div>
      </FlexBox>
    </button>
  );
}

// 찜 목록 페이지
export default function BookmarksPage() {
  const navigate = useNavigate();
  const { bookmarks } = useBookmarkStore();
  const bookmarkIds = Array.from(bookmarks);

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>
      {/* 헤더 — WDS TopNavigation */}
      <TopNavigation
        leadingContent={
          <TopNavigationButton onClick={() => navigate(-1)} aria-label="뒤로가기">
            <IconChevronLeft />
          </TopNavigationButton>
        }
        trailingContent={
          bookmarkIds.length > 0 ? (
            <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
              {bookmarkIds.length}개
            </Typography>
          ) : undefined
        }
      >
        찜한 단지
      </TopNavigation>

      <Box as="main" sx={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        {bookmarkIds.length === 0 ? (
          <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="16px" style={{ padding: '96px 0' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-line-normal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <Typography variant="body1" weight="medium" sx={{ color: 'var(--semantic-label-assistive)' }}>
              찜한 단지가 없습니다
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
              관심 있는 단지에 하트를 눌러 저장하세요
            </Typography>
          </FlexBox>
        ) : (
          <FlexBox flexDirection="column" gap="12px">
            {bookmarkIds.map((id) => (
              <BookmarkCard key={id} id={id} />
            ))}
          </FlexBox>
        )}
      </Box>
    </div>
  );
}
