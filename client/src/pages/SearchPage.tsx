import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApartmentSearch } from '../hooks/useApartment';
import ApartmentCard from '../components/apartment/ApartmentCard';
import { Loading, Button, IconButton } from '@wanteddev/wds';
import { IconChevronLeft } from '@wanteddev/wds-icon';
import SearchBar from '../components/ui/SearchBar';

// 검색 결과 페이지
export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data: results = [], isLoading, isError, refetch } = useApartmentSearch(query);

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4">
        <div className="flex items-center gap-3">
          <IconButton
            variant="normal"
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="flex-shrink-0"
          >
            <IconChevronLeft />
          </IconButton>
          <div className="flex-1">
            <SearchBar placeholder="아파트명, 지역 검색" />
          </div>
        </div>
      </header>

      <main className="px-5 py-4">
        {/* 검색어 표시 */}
        {query && (
          <p className="text-sm text-[#8B95A1] mb-4">
            <span className="font-bold text-[#191F28]">{query}</span> 검색 결과 {results.length}건
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loading size="32px" />
          </div>
        ) : isError ? (
          /* MINOR-02: 에러 상태 표시 + 재시도 버튼 */
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg className="w-16 h-16 text-[#FF4B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="text-center">
              <p className="text-base font-bold text-[#191F28]">검색 중 오류가 발생했습니다</p>
              <p className="text-sm text-[#8B95A1] mt-1">잠시 후 다시 시도해주세요</p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outlined"
              size="small"
            >
              다시 시도
            </Button>
          </div>
        ) : results.length === 0 ? (
          <EmptySearch keyword={query} />
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// 빈 검색 결과
function EmptySearch({ keyword }: { keyword: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <svg className="w-16 h-16 text-[#E5E8EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <div className="text-center">
        <p className="text-base font-bold text-[#191F28]">
          {keyword ? `'${keyword}' 검색 결과가 없습니다` : '검색어를 입력해주세요'}
        </p>
        {keyword && (
          <p className="text-sm text-[#8B95A1] mt-2">
            단지명, 지역명, 동 이름으로 검색해보세요
          </p>
        )}
      </div>
    </div>
  );
}
