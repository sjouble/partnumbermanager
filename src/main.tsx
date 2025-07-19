import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("main.tsx 로드됨");

// Service Worker 등록
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
console.log("root 요소:", rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error("root 요소를 찾을 수 없습니다!");
} 