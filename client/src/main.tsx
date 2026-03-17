import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@wanteddev/wds';
import '@wanteddev/wds/global.css';   // 1. WDS reset
import '@wanteddev/wds/theme.css';    // 2. WDS CSS 변수 토큰
import './index.css';                  // 3. 봄집 미니멀 글로벌 (폰트 + 애니메이션 + 유틸)
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
