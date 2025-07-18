import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
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

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 카메라 캡처
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setIsCameraActive(false);
      
      // OCR 시뮬레이션 (실제로는 PaddleOCR API 호출)
      setTimeout(() => {
        const mockText = generateMockText();
        setRecognizedText(mockText);
      }, 1000);
    }
  }, []);

  // 모의 OCR 텍스트 생성
  const generateMockText = () => {
    const mockTexts = [
      '123456\n456789\n987654',
      'ABC123\nDEF456\nGHI789',
      '111111\n222222\n333333',
      '999999\n888888\n777777'
    ];
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  };

  // 다시 촬영
  const retakePhoto = () => {
    setCapturedImage(null);
    setRecognizedText('');
    setSelectedText('');
    setIsCameraActive(true);
  };

  // 텍스트 선택 (범위 지정)
  const handleTextSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setSelectedText(selection.toString());
    }
  };

  // 품번 입력
  const addPartNumber = () => {
    const textToUse = selectedText || recognizedText.split('\n')[0];
    if (textToUse && currentQuantity) {
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
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button onClick={retakePhoto} className="retake-btn">
                다시 촬영
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
                />
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