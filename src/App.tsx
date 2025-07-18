import React, { useState } from 'react';
import './App.css';

function App() {
  const [testMessage, setTestMessage] = useState('앱이 정상적으로 로드되었습니다!');

  return (
    <div className="App">
      <header className="App-header">
        <h1>품번 정리 앱</h1>
        <p className="app-subtitle">Tesseract.js 클라이언트 사이드 OCR</p>
      </header>

      <main className="App-main">
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '15px', 
          textAlign: 'center',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>테스트 페이지</h2>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1rem' }}>{testMessage}</p>
          <button 
            onClick={() => setTestMessage('버튼이 정상적으로 작동합니다!')}
            style={{
              background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '10px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            테스트 버튼
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
