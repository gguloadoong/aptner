// ============================================================
// 인메모리 캐시 서비스 (node-cache 기반)
// ============================================================
import NodeCache from 'node-cache';

// TTL 상수 정의 (초 단위)
export const CACHE_TTL = {
  /** 실거래가: 6시간 */
  APARTMENT_TRADE: 60 * 60 * 6,
  /** 청약 목록: 1시간 */
  SUBSCRIPTION: 60 * 60,
  /** 지역 코드: 24시간 */
  REGION: 60 * 60 * 24,
  /** 트렌드: 30분 */
  TREND: 60 * 30,
} as const;

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      // TTL 체크 주기: 120초
      checkperiod: 120,
      // 삭제된 키는 통계에서 제외
      useClones: false,
    });

    console.log('[Cache] 캐시 서비스 초기화 완료');
  }

  /**
   * 캐시에서 값을 가져옵니다.
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * 캐시에 값을 저장합니다.
   * @param ttl - TTL(초). 미지정 시 node-cache 기본값 사용
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (ttl !== undefined) {
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
  }

  /**
   * 캐시에서 키를 삭제합니다.
   */
  del(key: string): void {
    this.cache.del(key);
  }

  /**
   * 패턴에 맞는 캐시 키 전체를 삭제합니다.
   */
  delByPattern(pattern: string): void {
    const keys = this.cache.keys();
    const matched = keys.filter((k) => k.includes(pattern));
    matched.forEach((k) => this.cache.del(k));
    if (matched.length > 0) {
      console.log(`[Cache] 패턴 "${pattern}" 으로 ${matched.length}개 키 삭제`);
    }
  }

  /**
   * 캐시 전체 초기화
   */
  flush(): void {
    this.cache.flushAll();
    console.log('[Cache] 전체 캐시 초기화');
  }

  /**
   * 현재 캐시 통계 반환
   */
  stats() {
    return this.cache.getStats();
  }

  /**
   * 캐시 키 목록 반환
   */
  keys(): string[] {
    return this.cache.keys();
  }
}

// 싱글톤 인스턴스 export
export const cacheService = new CacheService();
