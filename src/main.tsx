import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('main.tsx 로드됨');

// 서비스 워커 등록 (PWA 지원)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/partnumbermanager/sw.js')
      .then((registration) => {
        console.log('서비스 워커 등록 성공:', registration.scope);
      })
      .catch((error) => {
        console.log('서비스 워커 등록 실패:', error);
      });
  });
}

const rootElement = document.getElementById('root');
console.log('root 요소:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error('root 요소를 찾을 수 없습니다!');
}
