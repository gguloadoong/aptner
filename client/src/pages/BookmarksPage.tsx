// 찜한 단지 목록 페이지
import { useNavigate } from 'react-router-dom';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useApartmentDetail } from '../hooks/useApartment';
import { formatPriceShort, formatChange } from '../utils/formatNumber';
import { IconButton } from '@wanteddev/wds';
import { IconChevronLeft } from '@wanteddev/wds-icon';

// 단일 찜 단지 카드 — useApartmentDetail로 데이터 개별 조회
function BookmarkCard({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data: apartment, isLoading, isError } = useApartmentDetail(id);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E8EB] p-4 animate-pulse h-20" />
    );
  }

  if (isError || !apartment) {
    // 조회 실패 시 ID만 표시
    return (
      <div className="bg-white rounded-xl border border-[#E5E8EB] p-4">
        <p className="text-sm text-[#8B95A1]">{id}</p>
      </div>
    );
  }

  const priceColor =
    apartment.priceChangeType === 'up'
      ? 'text-[#FF4B4B]'
      : apartment.priceChangeType === 'down'
        ? 'text-[#3B82F6]'
        : 'text-[#8B95A1]';
  const priceArrow =
    apartment.priceChangeType === 'up' ? '▲' : apartment.priceChangeType === 'down' ? '▼' : '';

  return (
    <button
      onClick={() => navigate(`/apartment/${apartment.id}`)}
      className="w-full bg-white rounded-xl border border-[#E5E8EB] p-4 text-left transition-all hover:shadow-md hover:border-blue-200"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#191F28] truncate">{apartment.name}</p>
          <p className="text-xs text-[#8B95A1] mt-0.5 truncate">
            {apartment.address || `${apartment.district} ${apartment.dong}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0 pl-4">
          <p className="text-base font-black text-[#191F28]">
            {formatPriceShort(apartment.recentPrice)}
          </p>
          <p className={`text-xs font-semibold mt-0.5 ${priceColor}`}>
            {priceArrow} {formatChange(apartment.priceChange)}
          </p>
        </div>
      </div>
    </button>
  );
}

// 찜 목록 페이지
export default function BookmarksPage() {
  const navigate = useNavigate();
  const { bookmarks } = useBookmarkStore();
  const bookmarkIds = Array.from(bookmarks);

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <IconButton
            variant="normal"
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
          >
            <IconChevronLeft />
          </IconButton>
          <h1 className="text-base font-bold text-[#191F28] flex-1">찜한 단지</h1>
          {bookmarkIds.length > 0 && (
            <span className="text-sm text-[#8B95A1]">{bookmarkIds.length}개</span>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {bookmarkIds.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">🤍</div>
            <p className="text-base font-semibold text-[#8B95A1]">찜한 단지가 없습니다</p>
            <p className="text-sm text-[#C4C9CF]">관심 있는 단지에 하트를 눌러 저장하세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarkIds.map((id) => (
              <BookmarkCard key={id} id={id} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
