import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
import { saveAs } from 'file-saver';
import './App.css';

interface PartNumber {
  id: string;
  number: string;
  quantity: string;
  unit: string;
  expiryDate?: string;
}

function App() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [currentPartNumber, setCurrentPartNumber] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<string>('');
  const [currentUnit, setCurrentUnit] = useState<string>('카톤');
  const [currentExpiryDate, setCurrentExpiryDate] = useState<string>('');
  const [showUnitEditor, setShowUnitEditor] = useState(false);
  const [customUnits, setCustomUnits] = useState<string[]>(['카톤', '중포', '개']);
  const [cameraError, setCameraError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setCameraError('');
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setRecognizedText('');
    setSelectedText('');
    setCurrentPartNumber('');
    setCurrentQuantity('');
    setCurrentExpiryDate('');
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker('kor+eng');
      
      setProgress(30);
      
      const { data: { text } } = await worker.recognize(capturedImage);
      
      setProgress(100);
      setRecognizedText(text);
      
      await worker.terminate();
    } catch (error) {
      console.error('OCR 처리 중 오류:', error);
      setCameraError('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleTextSelect = (text: string) => {
    setSelectedText(text);
    setCurrentPartNumber(text);
  };

  const addPartNumber = () => {
    if (!currentPartNumber.trim() || !currentQuantity.trim()) return;

    const newPartNumber: PartNumber = {
      id: Date.now().toString(),
      number: currentPartNumber.trim(),
      quantity: currentQuantity.trim(),
      unit: currentUnit,
      expiryDate: currentExpiryDate.trim() || undefined
    };

    setPartNumbers(prev => [...prev, newPartNumber]);
    setCurrentPartNumber('');
    setCurrentQuantity('');
    setCurrentExpiryDate('');
  };

  const removePartNumber = (id: string) => {
    setPartNumbers(prev => prev.filter(item => item.id !== id));
  };

  const addCustomUnit = (unit: string) => {
    if (unit.trim() && !customUnits.includes(unit.trim())) {
      setCustomUnits(prev => [...prev, unit.trim()]);
    }
    setShowUnitEditor(false);
  };

  const saveToFile = () => {
    const content = partNumbers.map(item => 
      `품번: ${item.number}, 수량: ${item.quantity}${item.unit}${item.expiryDate ? `, 유통기한: ${item.expiryDate}` : ''}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, '품번목록.txt');
  };

  const shareResults = async () => {
    const content = partNumbers.map(item => 
      `품번: ${item.number}, 수량: ${item.quantity}${item.unit}${item.expiryDate ? `, 유통기한: ${item.expiryDate}` : ''}`
    ).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: '품번 목록',
          text: content
        });
      } catch (error) {
        console.log('공유 취소됨');
      }
    } else {
      // 공유 API가 지원되지 않는 경우 클립보드에 복사
      navigator.clipboard.writeText(content);
      alert('품번 목록이 클립보드에 복사되었습니다.');
    }
  };

  const handleCameraError = () => {
    setCameraError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>품번 정리 앱</h1>
        <p className="app-subtitle">Tesseract.js 클라이언트 사이드 OCR</p>
      </header>

      <main className="App-main">
        {/* 카메라 섹션 */}
        <section className="camera-section">
          <h2>📷 카메라 촬영</h2>
          {!capturedImage ? (
            <div className="camera-container">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }}
                onUserMediaError={handleCameraError}
              />
              <button className="capture-btn" onClick={capture}>
                📸 촬영하기
              </button>
            </div>
          ) : (
            <div className="image-container">
              <img src={capturedImage} alt="촬영된 이미지" />
              <div className="action-buttons">
                <button className="retake-btn" onClick={retake}>
                  🔄 다시 촬영
                </button>
                <button className="capture-btn" onClick={processImage} disabled={isProcessing}>
                  🔍 텍스트 인식
                </button>
              </div>
            </div>
          )}
          
          {cameraError && (
            <div className="camera-error">
              <p>{cameraError}</p>
            </div>
          )}
        </section>

        {/* 처리 중 상태 */}
        {isProcessing && (
          <div className="processing">
            <div className="loading-spinner"></div>
            <p>이미지를 분석하고 있습니다...</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        )}

        {/* OCR 결과 */}
        {recognizedText && (
          <section className="result-section">
            <h2>🔍 인식된 텍스트</h2>
            <div className="ocr-result">
              <h3>선택할 텍스트를 클릭하세요:</h3>
              <div className="recognized-text">
                {recognizedText.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className={`text-line ${selectedText === line ? 'selected-text' : ''}`}
                    onClick={() => handleTextSelect(line)}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 입력 섹션 */}
        {selectedText && (
          <section className="input-section">
            <h2>📝 품번 정보 입력</h2>
            <div className="input-form">
              <div className="form-group">
                <label>품번:</label>
                <input
                  type="text"
                  value={currentPartNumber}
                  onChange={(e) => setCurrentPartNumber(e.target.value)}
                  placeholder="품번을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>수량:</label>
                <input
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  placeholder="수량을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>단위:</label>
                <select value={currentUnit} onChange={(e) => setCurrentUnit(e.target.value)}>
                  {customUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <button 
                  className="unit-edit-btn"
                  onClick={() => setShowUnitEditor(!showUnitEditor)}
                >
                  단위 추가
                </button>
              </div>
              
              {showUnitEditor && (
                <div className="unit-editor">
                  <input
                    type="text"
                    placeholder="새 단위 입력"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomUnit((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button onClick={() => {
                    const input = document.querySelector('.unit-editor input') as HTMLInputElement;
                    if (input) {
                      addCustomUnit(input.value);
                      input.value = '';
                    }
                  }}>
                    추가
                  </button>
                </div>
              )}
              
              <div className="form-group">
                <label>유통기한 (선택):</label>
                <input
                  type="text"
                  value={currentExpiryDate}
                  onChange={(e) => setCurrentExpiryDate(e.target.value)}
                  placeholder="YYYYMMDD 형식 (예: 20241231)"
                  maxLength={8}
                />
              </div>
              
              <button className="add-btn" onClick={addPartNumber}>
                ➕ 품번 추가
              </button>
            </div>
          </section>
        )}

        {/* 품번 목록 */}
        {partNumbers.length > 0 && (
          <section className="list-section">
            <h2>📋 품번 목록</h2>
            <div className="part-numbers-list">
              {partNumbers.map(item => (
                <div key={item.id} className="part-number-item">
                  <div>
                    <div className="part-number">{item.number}</div>
                    <div className="quantity">{item.quantity}{item.unit}</div>
                    {item.expiryDate && (
                      <div className="expiry-date">유통기한: {item.expiryDate}</div>
                    )}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removePartNumber(item.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            
            <div className="final-actions">
              <button className="save-btn" onClick={saveToFile}>
                💾 파일로 저장
              </button>
              <button className="share-btn" onClick={shareResults}>
                📤 공유하기
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
