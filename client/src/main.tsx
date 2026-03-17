import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@wanteddev/wds';
import './index.css';                  // 1. Tailwind preflight + 유틸리티
import '@wanteddev/wds/global.css';   // 2. WDS reset + 글로벌 스타일 (disableDefaultGlobalStyle로 런타임 주입 안 되므로 정적 import)
import '@wanteddev/wds/theme.css';    // 3. WDS CSS 변수 토큰
import './styles/design-tokens.css';  // 4. 봄집 브랜드 토큰 + WDS semantic 오버라이드
import App from './App.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider disableDefaultGlobalStyle>
      <App />
    </ThemeProvider>
  </StrictMode>
);
