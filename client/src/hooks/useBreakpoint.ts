import { useState, useEffect } from 'react';

/**
 * 미디어쿼리 감지 훅
 * WDS useMediaQuery는 CSS 헬퍼만 반환하므로 별도로 구현
 */
export function useBreakpoint(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    // 초기값은 useState initializer에서 처리하므로 동기 setState 불필요
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** PC (lg 이상, 1024px) 여부 */
export function useIsPC(): boolean {
  return useBreakpoint('(min-width: 1024px)');
}
