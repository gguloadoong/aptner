import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApartmentSearch } from '../hooks/useApartment';
import ApartmentCard from '../components/apartment/ApartmentCard';
import { Button, Box, FlexBox, Typography, TopNavigation, TopNavigationButton } from '@wanteddev/wds';
import { IconChevronLeft } from '@wanteddev/wds-icon';
import SearchBar from '../components/ui/SearchBar';

// 검색 결과 페이지
export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data: results = [], isLoading, isError, refetch } = useApartmentSearch(query);

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>
      {/* 헤더 — WDS TopNavigation */}
      <TopNavigation
        leadingContent={
          <TopNavigationButton onClick={() => navigate(-1)} aria-label="뒤로가기">
            <IconChevronLeft />
          </TopNavigationButton>
        }
      >
        <div style={{ flex: 1 }}>
          <SearchBar placeholder="아파트명, 지역 검색" />
        </div>
      </TopNavigation>

      <Box as="main" sx={{ padding: '20px' }}>
        {/* 검색어 표시 */}
        {query && (
          <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700, color: 'var(--semantic-label-normal)' }}>{query}</span> 검색 결과 {results.length}건
          </Typography>
        )}

        {/* 검색어가 1자 이하일 때 안내 */}
        {!isLoading && query.length > 0 && query.length < 2 ? (
          <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="8px" style={{ padding: '64px 0' }}>
            <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
              2글자 이상 입력해주세요
            </Typography>
          </FlexBox>
        ) : isLoading ? (
          <FlexBox flexDirection="column" gap="12px">
            {[1, 2, 3, 4, 5].map((i) => (
              <Box
                key={i}
                sx={{
                  height: '80px',
                  backgroundColor: 'var(--semantic-background-normal-normal)',
                  borderRadius: '12px',
                  border: '1px solid var(--semantic-line-normal)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 16px',
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Box sx={{ height: '14px', width: '55%', backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '4px' }} />
                  <Box sx={{ height: '12px', width: '35%', backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '4px' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  <Box sx={{ height: '16px', width: '48px', backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '4px' }} />
                  <Box sx={{ height: '12px', width: '36px', backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '4px' }} />
                </Box>
              </Box>
            ))}
          </FlexBox>
        ) : isError ? (
          <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="16px" style={{ padding: '64px 0' }}>
            <svg width="64" height="64" fill="none" stroke="#FF4B4B" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
                검색 중 오류가 발생했습니다
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '4px' }}>
                잠시 후 다시 시도해주세요
              </Typography>
            </div>
            <Button onClick={() => refetch()} variant="outlined" size="small">
              다시 시도
            </Button>
          </FlexBox>
        ) : results.length === 0 ? (
          <EmptySearch keyword={query} />
        ) : (
          <FlexBox flexDirection="column" gap="12px">
            {results.map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} />
            ))}
          </FlexBox>
        )}
      </Box>
    </div>
  );
}

// 빈 검색 결과
function EmptySearch({ keyword }: { keyword: string }) {
  return (
    <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="16px" style={{ padding: '64px 0' }}>
      <svg width="64" height="64" fill="none" stroke="var(--semantic-line-normal)" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
          {keyword ? `'${keyword}' 검색 결과가 없습니다` : '검색어를 입력해주세요'}
        </Typography>
        {keyword && (
          <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '8px' }}>
            단지명, 지역명, 동 이름으로 검색해보세요
          </Typography>
        )}
      </div>
    </FlexBox>
  );
}
