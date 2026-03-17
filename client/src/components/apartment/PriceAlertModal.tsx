import { useState } from 'react';
import { TextButton, IconButton } from '@wanteddev/wds';
import { IconClose, IconBell, IconBellFill } from '@wanteddev/wds-icon';
import { useAlertStore } from '../../stores/alertStore';
import { formatPriceShort } from '../../utils/formatNumber';

interface PriceAlertModalProps {
  apartmentId: string;
  apartmentName: string;
  currentPrice: number;
  area: string;
  onClose: () => void;
}

export default function PriceAlertModal({
  apartmentId,
  apartmentName,
  currentPrice,
  area,
  onClose,
}: PriceAlertModalProps) {
  const { addAlert, removeAlert, hasAlert, getAlert } = useAlertStore();
  const existing = getAlert(apartmentId);

  // 기본값: 현재가의 5% 하락
  const [targetPrice, setTargetPrice] = useState<string>(
    existing
      ? String(existing.targetPrice / 10000)
      : String(Math.round((currentPrice * 0.95) / 10000))
  );

  const targetPriceNum = Math.round(parseFloat(targetPrice || '0') * 10000);
  const dropRate =
    currentPrice > 0 ? Math.round(((currentPrice - targetPriceNum) / currentPrice) * 100) : 0;

  const isValid = targetPriceNum > 0 && targetPriceNum < currentPrice;

  const handleSave = () => {
    if (!isValid) return;
    addAlert({
      apartmentId,
      apartmentName,
      targetPrice: targetPriceNum,
      currentPrice,
      area,
    });
    onClose();
  };

  const handleRemove = () => {
    removeAlert(apartmentId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 본체 */}
      <div className="relative z-10 w-full max-w-md bg-white md:rounded-2xl rounded-t-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <IconBell className="text-blue-600" />
            <h2 className="text-base font-bold text-[#191F28]">가격 하락 알림 설정</h2>
          </div>
          <IconButton variant="normal" onClick={onClose} aria-label="닫기">
            <IconClose />
          </IconButton>
        </div>

        {/* 단지명 */}
        <div className="bg-[#F7FAF8] rounded-xl p-3 mb-5">
          <p className="text-xs text-[#8B95A1]">{area}㎡ 기준</p>
          <p className="text-sm font-bold text-[#191F28] mt-0.5">{apartmentName}</p>
          <p className="text-lg font-black text-[#191F28] mt-1">
            현재가: {formatPriceShort(currentPrice)}
          </p>
        </div>

        {/* 목표 가격 입력 */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#191F28] block mb-2">
            이 가격 이하로 떨어지면 알림
          </label>
          <div className="flex items-center gap-2 border border-[#E5E8EB] rounded-xl px-4 py-3 focus-within:border-blue-400">
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="예: 95000"
              className="flex-1 text-base font-bold text-[#191F28] outline-none bg-transparent"
            />
            <span className="text-sm text-[#8B95A1] flex-shrink-0">만원</span>
          </div>
          {targetPriceNum > 0 && (
            <p
              className={`text-xs mt-1.5 ${
                isValid ? 'text-blue-600' : 'text-[#FF4B4B]'
              }`}
            >
              {isValid
                ? `현재가 대비 ${dropRate}% 하락 시 알림`
                : '목표 가격은 현재가보다 낮아야 합니다'}
            </p>
          )}
        </div>

        {/* 빠른 설정 버튼 */}
        <div className="flex gap-2 mb-5">
          {[3, 5, 10].map((pct) => (
            <button
              key={pct}
              onClick={() =>
                setTargetPrice(String(Math.round((currentPrice * (1 - pct / 100)) / 10000)))
              }
              className="flex-1 py-2 rounded-lg text-xs font-semibold border border-[#E5E8EB] text-[#8B95A1] hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              -{pct}%
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {hasAlert(apartmentId) && (
            <TextButton size="medium" color="assistive" onClick={handleRemove} className="flex-1">
              알림 해제
            </TextButton>
          )}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={[
              'flex-1 py-3 rounded-xl text-sm font-bold transition-colors',
              isValid
                ? 'bg-[#0066FF] text-white hover:bg-[#0052CC]'
                : 'bg-[#E5E8EB] text-[#8B95A1] cursor-not-allowed',
            ].join(' ')}
          >
            {existing ? '알림 수정' : '알림 설정'}
          </button>
        </div>

        <p className="text-[11px] text-[#8B95A1] text-center mt-3">
          앱 방문 시 가격을 확인하여 알림을 드립니다
        </p>
      </div>
    </div>
  );
}

// 알림 설정 버튼 (ApartmentDetailPage 헤더용)
export function AlertButton({
  apartmentId,
  apartmentName,
  currentPrice,
  area,
}: {
  apartmentId: string;
  apartmentName: string;
  currentPrice: number;
  area: string;
}) {
  const [open, setOpen] = useState(false);
  const { hasAlert } = useAlertStore();
  const active = hasAlert(apartmentId);

  return (
    <>
      <IconButton
        variant="normal"
        onClick={() => setOpen(true)}
        aria-label={active ? '알림 설정됨' : '가격 알림 설정'}
      >
        {active ? (
          <IconBellFill style={{ color: '#0066FF' }} />
        ) : (
          <IconBell />
        )}
      </IconButton>

      {open && (
        <PriceAlertModal
          apartmentId={apartmentId}
          apartmentName={apartmentName}
          currentPrice={currentPrice}
          area={area}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
