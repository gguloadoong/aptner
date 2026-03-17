import React, { useState, useCallback } from 'react';
import { SearchField } from '@wanteddev/wds';
import { useApartmentSearch } from '../../hooks/useApartment';
import { useFilterStore } from '../../stores/filterStore';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@wanteddev/wds';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (keyword: string) => void;
  showSuggestions?: boolean;
}

// 검색바 컴포넌트 — WDS SearchField 기반 (자동완성 포함)
const SearchBar = React.memo<SearchBarProps>(
  ({ placeholder = '아파트명, 지역 검색', onSearch, showSuggestions = true }) => {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
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

    const showDropdown =
      isFocused &&
      showSuggestions &&
      (inputValue.length >= 2 ? searchResults.length > 0 : recentSearches.length > 0);

    return (
      <div style={{ position: 'relative' }}>
        <SearchField
          placeholder={placeholder}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onReset={() => setInputValue('')}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyDown}
        />

        {/* 자동완성 드롭다운 */}
        {showDropdown && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: 'var(--semantic-background-normal-normal)',
              borderRadius: '16px',
              border: '1px solid var(--semantic-line-normal)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {inputValue.length < 2 ? (
              // 최근 검색어
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--semantic-line-normal)',
                  }}
                >
                  <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
                    최근 검색
                  </Typography>
                  <button
                    onClick={clearRecentSearches}
                    style={{
                      fontSize: '12px',
                      color: 'var(--semantic-label-assistive)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                  >
                    전체 삭제
                  </button>
                </div>
                {recentSearches.map((keyword) => (
                  <button
                    key={keyword}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 100ms',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'var(--semantic-background-normal-alternative)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                    onClick={() => handleSubmit(keyword)}
                  >
                    <svg width="16" height="16" fill="none" stroke="var(--semantic-label-assistive)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <Typography variant="body2" sx={{ color: 'var(--semantic-label-normal)' }}>
                      {keyword}
                    </Typography>
                  </button>
                ))}
              </div>
            ) : (
              // 검색 결과
              searchResults.slice(0, 10).map((apt) => (
                <button
                  key={apt.id}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--semantic-line-normal)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 100ms',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'var(--semantic-background-normal-alternative)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                  onClick={() => {
                    addRecentSearch(apt.name);
                    navigate(`/apartment/${apt.id}`);
                    setInputValue('');
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="var(--semantic-primary-normal)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" weight="medium" sx={{ color: 'var(--semantic-label-normal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.name}
                    </Typography>
                    <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.address}
                    </Typography>
                  </div>
                </button>
              ))
            )}
          </Box>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
export default SearchBar;
