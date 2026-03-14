import React, { useState, useCallback, useRef } from 'react';
import { useApartmentSearch } from '../../hooks/useApartment';
import { useFilterStore } from '../../stores/filterStore';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (keyword: string) => void;
  showSuggestions?: boolean;
}

// 검색바 컴포넌트 (자동완성 포함)
const SearchBar = React.memo<SearchBarProps>(
  ({ placeholder = '아파트명, 지역 검색', className = '', onSearch, showSuggestions = true }) => {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const { recentSearches, addRecentSearch, clearRecentSearches } = useFilterStore();

    // 검색 결과 조회
    const { data: searchResults = [] } = useApartmentSearch(
      showSuggestions ? inputValue : ''
    );

    const handleSubmit = useCallback(
      (keyword: string) => {
        if (!keyword.trim()) return;
        addRecentSearch(keyword);
        onSearch?.(keyword);
        navigate(`/search?q=${encodeURIComponent(keyword)}`);
        setInputValue('');
        inputRef.current?.blur();
      },
      [addRecentSearch, onSearch, navigate]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleSubmit(inputValue);
        }
      },
      [handleSubmit, inputValue]
    );

    const showDropdown = isFocused && showSuggestions && (inputValue.length >= 2 ? searchResults.length > 0 : recentSearches.length > 0);

    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center bg-white rounded-2xl border border-[#E5E8EB] shadow-sm px-4 py-3 gap-3">
          {/* 검색 아이콘 */}
          <svg className="w-4 h-4 text-[#8B95A1] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none bg-transparent"
          />

          {/* 초기화 버튼 */}
          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8B95A1] flex items-center justify-center"
              aria-label="검색어 지우기"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 자동완성 드롭다운 */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E5E8EB] shadow-lg z-50 overflow-hidden">
            {inputValue.length < 2 ? (
              // 최근 검색어
              <div>
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E8EB]">
                  <span className="text-xs text-[#8B95A1] font-medium">최근 검색</span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-[#8B95A1] hover:text-[#191F28]"
                  >
                    전체 삭제
                  </button>
                </div>
                {recentSearches.map((keyword) => (
                  <button
                    key={keyword}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F6F8] transition-colors text-left"
                    onClick={() => handleSubmit(keyword)}
                  >
                    <svg className="w-4 h-4 text-[#8B95A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-[#191F28]">{keyword}</span>
                  </button>
                ))}
              </div>
            ) : (
              // 검색 결과
              searchResults.slice(0, 10).map((apt) => (
                <button
                  key={apt.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F6F8] transition-colors text-left border-b border-[#E5E8EB] last:border-none"
                  onClick={() => {
                    addRecentSearch(apt.name);
                    navigate(`/apartment/${apt.id}`);
                    setInputValue('');
                  }}
                >
                  <svg className="w-4 h-4 text-[#1B64DA] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#191F28] truncate">{apt.name}</p>
                    <p className="text-xs text-[#8B95A1] truncate">{apt.address}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
export default SearchBar;
