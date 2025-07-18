import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { 
  performOCRWithProgress, 
  extractNumbers, 
  isValidPartNumber,
  performAdvancedOCR 
} from './utils/ocr';
import './App.css';

interface PartNumber {
  id: string;
  number: string;
  quantity: string;
  unit: string;
  expiryDate: string;
}

function App() {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [currentPartNumber, setCurrentPartNumber] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('1');
  const [currentUnit, setCurrentUnit] = useState('카톤');
  const [currentExpiryDate, setCurrentExpiryDate] = useState('');
  const [units, setUnits] = useState(['카톤', '중포', '개', '박스', 'kg']);
  const [showUnitEditor, setShowUnitEditor] = useState(false);
  const [newUnit, setNewUnit] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 카메라 캡처
  const capture = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setIsCameraActive(false);
      setIsProcessing(true);
      setError('');
      setProgress(0);
      
      try {
        // 진행률을 추적하는 OCR 수행
        const recognizedText = await performOCRWithProgress(
          imageSrc!, 
          (progress) => setProgress(progress)
        );
        
        setRecognizedText(recognizedText);
        
        // 숫자 추출 및 표시
        const numbers = extractNumbers(recognizedText);
        if (numbers.length === 0) {
          setError('숫자를 인식하지 못했습니다. 다시 촬영해주세요.');
        } else {
          console.log('인식된 숫자들:', numbers);
        }
      } catch (error) {
        console.error('OCR 처리 오류:', error);
        setError('텍스트 인식에 실패했습니다. 다시 시도해주세요.');
        setRecognizedText('');
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    }
  }, []);

  // 고급 OCR (더 정확한 인식을 위해)
  const handleAdvancedOCR = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const result = await performAdvancedOCR(capturedImage, {
        lang: 'eng',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        psm: 6
      });
      
      setRecognizedText(result.text);
      console.log('OCR 신뢰도:', result.confidence);
      
      if (result.confidence < 30) {
        setError('인식 신뢰도가 낮습니다. 더 선명하게 촬영해주세요.');
      }
    } catch (error) {
      setError('고급 OCR 처리에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 다시 촬영
  const retakePhoto = () => {
    setCapturedImage(null);
    setRecognizedText('');
    setSelectedText('');
    setError('');
    setProgress(0);
    setIsCameraActive(true);
  };

  // 텍스트 선택 (범위 지정)
  const handleTextSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      const selectedText = selection.toString();
      setSelectedText(selectedText);
      
      // 선택된 텍스트가 유효한 품번인지 확인
      if (isValidPartNumber(selectedText)) {
        console.log('유효한 품번 선택됨:', selectedText);
      }
    }
  };

  // 품번 입력
  const addPartNumber = () => {
    const textToUse = selectedText || recognizedText.split('\n')[0];
    if (textToUse && currentQuantity) {
      // 품번 유효성 검사
      if (!isValidPartNumber(textToUse)) {
        setError('유효하지 않은 품번입니다. 6-12자리 숫자를 입력해주세요.');
        return;
      }
      
      const newPartNumber: PartNumber = {
        id: Date.now().toString(),
        number: textToUse.trim(),
        quantity: currentQuantity,
        unit: currentUnit,
        expiryDate: currentExpiryDate
      };
      
      setPartNumbers([...partNumbers, newPartNumber]);
      setCurrentPartNumber('');
      setCurrentQuantity('1');
      setCurrentExpiryDate('');
      setSelectedText('');
      setRecognizedText('');
      setCapturedImage(null);
      setError('');
      setIsCameraActive(true);
    }
  };

  // 품번 삭제
  const removePartNumber = (id: string) => {
    setPartNumbers(partNumbers.filter(pn => pn.id !== id));
  };

  // 단위 추가
  const addUnit = () => {
    if (newUnit && !units.includes(newUnit)) {
      setUnits([...units, newUnit]);
      setNewUnit('');
      setShowUnitEditor(false);
    }
  };

  // 메모장 저장
  const saveToFile = () => {
    const content = partNumbers.map(pn => {
      let line = `${pn.number} ${pn.quantity}${pn.unit}`;
      if (pn.expiryDate) {
        line += ` 유통기한 ${pn.expiryDate}`;
      }
      return line;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, '품번목록.txt');
  };

  // 공유 기능
  const shareContent = () => {
    const content = partNumbers.map(pn => {
      let line = `${pn.number} ${pn.quantity}${pn.unit}`;
      if (pn.expiryDate) {
        line += ` 유통기한 ${pn.expiryDate}`;
      }
      return line;
    }).join('\n');

    if (navigator.share) {
      navigator.share({
        title: '품번 목록',
        text: content
      });
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(content).then(() => {
        alert('품번 목록이 클립보드에 복사되었습니다.');
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>품번 정리 앱</h1>
        <p className="app-subtitle">Tesseract.js 클라이언트 사이드 OCR</p>
      </header>

      <main className="App-main">
        {/* 카메라 섹션 */}
        {isCameraActive && (
          <div className="camera-section">
            <h2>카메라</h2>
            <div className="camera-container">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                height="auto"
              />
            </div>
            <button onClick={capture} className="capture-btn">
              촬영
            </button>
          </div>
        )}

        {/* 캡처된 이미지 및 OCR 결과 */}
        {capturedImage && (
          <div className="result-section">
            <h2>인식 결과</h2>
            <div className="image-container">
              <img src={capturedImage} alt="촬영된 이미지" />
            </div>
            
            {isProcessing && (
              <div className="processing">
                <p>텍스트를 인식하고 있습니다...</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
                <p className="progress-text">{Math.round(progress * 100)}%</p>
                <div className="loading-spinner"></div>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={handleAdvancedOCR} className="retry-btn">
                  고급 OCR 재시도
                </button>
              </div>
            )}
            
            <div className="ocr-result">
              <h3>인식된 텍스트:</h3>
              <div 
                className="recognized-text"
                onMouseUp={handleTextSelection}
              >
                {recognizedText.split('\n').map((line, index) => (
                  <div key={index} className="text-line">{line}</div>
                ))}
              </div>
              
              {selectedText && (
                <div className="selected-text">
                  <strong>선택된 텍스트: {selectedText}</strong>
                  {isValidPartNumber(selectedText) && (
                    <span className="valid-indicator">✓ 유효한 품번</span>
                  )}
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button onClick={retakePhoto} className="retake-btn">
                다시 촬영
              </button>
              <button onClick={handleAdvancedOCR} className="advanced-btn">
                고급 OCR
              </button>
            </div>
          </div>
        )}

        {/* 품번 입력 폼 */}
        {(capturedImage || partNumbers.length > 0) && (
          <div className="input-section">
            <h2>품번 입력</h2>
            <div className="input-form">
              <div className="form-group">
                <label>품번:</label>
                <input
                  type="text"
                  value={selectedText || currentPartNumber}
                  onChange={(e) => setCurrentPartNumber(e.target.value)}
                  placeholder="품번을 입력하거나 위에서 선택하세요"
                  className={selectedText && !isValidPartNumber(selectedText) ? 'invalid' : ''}
                />
                {selectedText && !isValidPartNumber(selectedText) && (
                  <span className="error-hint">6-12자리 숫자를 입력해주세요</span>
                )}
              </div>

              <div className="form-group">
                <label>수량:</label>
                <input
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>단위:</label>
                <select value={currentUnit} onChange={(e) => setCurrentUnit(e.target.value)}>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowUnitEditor(!showUnitEditor)}
                  className="unit-edit-btn"
                >
                  단위 편집
                </button>
              </div>

              {showUnitEditor && (
                <div className="unit-editor">
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="새 단위 입력"
                  />
                  <button onClick={addUnit}>추가</button>
                </div>
              )}

              <div className="form-group">
                <label>유통기한 (선택사항):</label>
                <input
                  type="text"
                  value={currentExpiryDate}
                  onChange={(e) => setCurrentExpiryDate(e.target.value)}
                  placeholder="YYYYMMDD (8자리)"
                  maxLength={8}
                />
              </div>

              <button onClick={addPartNumber} className="add-btn">
                입력
              </button>
            </div>
          </div>
        )}

        {/* 품번 목록 */}
        {partNumbers.length > 0 && (
          <div className="list-section">
            <h2>품번 목록</h2>
            <div className="part-numbers-list">
              {partNumbers.map((pn) => (
                <div key={pn.id} className="part-number-item">
                  <span className="part-number">{pn.number}</span>
                  <span className="quantity">{pn.quantity}{pn.unit}</span>
                  {pn.expiryDate && (
                    <span className="expiry-date">유통기한: {pn.expiryDate}</span>
                  )}
                  <button 
                    onClick={() => removePartNumber(pn.id)}
                    className="remove-btn"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div className="final-actions">
              <button onClick={saveToFile} className="save-btn">
                저장
              </button>
              <button onClick={shareContent} className="share-btn">
                공유
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
