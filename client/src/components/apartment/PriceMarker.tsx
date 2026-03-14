import React from 'react';
import { formatPriceShort } from '../../utils/formatNumber';

interface PriceMarkerProps {
  price: number;
  changeType: 'up' | 'down' | 'flat';
  isSelected?: boolean;
  onClick?: () => void;
}

// 지도 위 가격 마커 스타일 컴포넌트
const PriceMarker = React.memo<PriceMarkerProps>(
  ({ price, changeType, isSelected = false, onClick }) => {
    const bgColor =
      changeType === 'up'
        ? 'bg-[#FF4B4B]'
        : changeType === 'down'
          ? 'bg-[#00C896]'
          : 'bg-[#8B95A1]';

    return (
      <button
        onClick={onClick}
        className={[
          'px-2 py-1 rounded-xl text-white text-xs font-bold shadow-md border-2 border-white',
          'transition-transform duration-150 active:scale-95 cursor-pointer',
          bgColor,
          isSelected ? 'scale-110 ring-2 ring-offset-1 ring-[#1B64DA]' : '',
        ].join(' ')}
      >
        {formatPriceShort(price)}
      </button>
    );
  }
);

PriceMarker.displayName = 'PriceMarker';
export default PriceMarker;
