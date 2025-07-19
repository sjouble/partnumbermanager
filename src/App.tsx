import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
import { saveAs } from 'file-saver';

interface PartNumber {
  id: string;
  number: string;
  quantity: string;
  unit: string;
  expiryDate?: string;
}

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function App() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('카톤');
  const [expiryDate, setExpiryDate] = useState('');
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUnitEditor, setShowUnitEditor] = useState(false);
  const [units, setUnits] = useState(['카톤', '중포', '개']);
  const [newUnit, setNewUnit] = useState('');
  const [editingUnit, setEditingUnit] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionArea, setSelectionArea] = useState<SelectionArea | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);

  // 스크린샷 캡처
  const captureScreenshot = useCallback(() => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      setCapturedImage(screenshot);
      setErrorMessage('');
      setSelectionArea(null);
    }
  }, [webcamRef]);

  // 이미지 초기화
  const resetImage = () => {
    setCapturedImage(null);
    setRecognizedText('');
    setSelectedText('');
    setPartNumber('');
    setQuantity('');
    setExpiryDate('');
    setSelectionArea(null);
    setSelectionStart(null);
  };

  // 마우스 선택 시작
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef2.current) return;
    
    const rect = canvasRef2.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionArea(null);
  };

  // 마우스 선택 중
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !selectionStart || !canvasRef2.current) return;
    
    const rect = canvasRef2.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = x - selectionStart.x;
    const height = y - selectionStart.y;
    
    setSelectionArea({
      x: width > 0 ? selectionStart.x : x,
      y: height > 0 ? selectionStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  // 마우스 선택 종료
  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  // 터치 선택 시작
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length >= 2) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionArea(null);
      return;
    }
    
    if (!canvasRef2.current) return;
    
    const rect = canvasRef2.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionArea(null);
  };

  // 터치 선택 중
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length >= 2 || !isSelecting || !selectionStart || !canvasRef2.current) return;
    
    e.preventDefault();
    
    const rect = canvasRef2.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const width = x - selectionStart.x;
    const height = y - selectionStart.y;
    
    setSelectionArea({
      x: width > 0 ? selectionStart.x : x,
      y: height > 0 ? selectionStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  // 터치 선택 종료
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length >= 2) {
      setIsSelecting(false);
      setSelectionStart(null);
      return;
    }
    setIsSelecting(false);
    setSelectionStart(null);
  };

  // 캔버스에 선택 영역 그리기
  useEffect(() => {
    if (!canvasRef2.current || !capturedImage) return;
    
    const canvas = canvasRef2.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      if (selectionArea) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height);
        
        ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
        ctx.fillRect(selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height);
      }
    };
    img.src = capturedImage;
  }, [capturedImage, selectionArea]);

  // OCR 처리
  const processOCR = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const worker = await createWorker('kor+eng');
      setProgress(20);
      
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허기니디리미비시이지치키티피히구누두루무부수우주추쿠투푸후그느드르므브스으즈츠크트프흐',
        tessedit_pageseg_mode: 6 as any,
        tessedit_ocr_engine_mode: '3',
        preserve_interword_spaces: '1',
        textord_heavy_nr: '1',
        textord_min_linesize: '2.5'
      });
      setProgress(40);
      
      let imageToProcess = capturedImage;
      
      // 선택 영역이 있으면 해당 영역만 처리
      if (selectionArea && canvasRef2.current) {
        const canvas = canvasRef2.current;
        if (canvas.getContext('2d')) {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCanvas.width = selectionArea.width;
            tempCanvas.height = selectionArea.height;
            tempCtx.drawImage(
              canvas, 
              selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height,
              0, 0, selectionArea.width, selectionArea.height
            );
            imageToProcess = tempCanvas.toDataURL('image/jpeg', 0.9);
          }
        }
      }
      
      setProgress(60);
      
      const { data: { text } } = await worker.recognize(imageToProcess);
      setProgress(100);
      
      const cleanedText = text
        .replace(/[^\w\s가-힣]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      setRecognizedText(cleanedText);
      await worker.terminate();
      
    } catch (error) {
      console.error('OCR 처리 중 오류:', error);
      setErrorMessage('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // 텍스트 선택
  const handleTextSelect = (text: string) => {
    setSelectedText(text);
    setPartNumber(text);
  };

  // 품번 추가
  const addPartNumber = () => {
    if (!partNumber.trim() || !quantity.trim()) return;
    
    const newPart: PartNumber = {
      id: Date.now().toString(),
      number: partNumber.trim(),
      quantity: quantity.trim(),
      unit: unit,
      expiryDate: expiryDate.trim() || undefined
    };
    
    setPartNumbers(prev => [...prev, newPart]);
    setPartNumber('');
    setQuantity('');
    setExpiryDate('');
  };

  // 품번 삭제
  const removePartNumber = (id: string) => {
    setPartNumbers(prev => prev.filter(item => item.id !== id));
  };

  // 새 단위 추가
  const addUnit = (unitName: string) => {
    if (unitName.trim() && !units.includes(unitName.trim())) {
      setUnits(prev => [...prev, unitName.trim()]);
    }
    setNewUnit('');
    setShowUnitEditor(false);
  };

  // 단위 편집
  const editUnit = (index: number) => {
    setEditingIndex(index);
    setEditingUnit(units[index]);
  };

  // 단위 저장
  const saveUnit = () => {
    if (editingUnit.trim() && editingIndex >= 0) {
      const newUnits = [...units];
      newUnits[editingIndex] = editingUnit.trim();
      setUnits(newUnits);
      
      // 현재 선택된 단위가 편집된 단위라면 업데이트
      if (unit === units[editingIndex]) {
        setUnit(newUnits[editingIndex]);
      }
    }
    setEditingIndex(-1);
    setEditingUnit('');
  };

  // 단위 삭제
  const deleteUnit = (index: number) => {
    if (index >= 0 && units.length > 1) {
      const newUnits = units.filter((_, i) => i !== index);
      setUnits(newUnits);
      
      // 현재 선택된 단위가 삭제된 단위라면 첫 번째 단위로 변경
      if (unit === units[index]) {
        setUnit(newUnits[0]);
      }
    }
  };

  // 파일로 저장
  const saveToFile = () => {
    const content = partNumbers.map(item => 
      `품번: ${item.number}, 수량: ${item.quantity}${item.unit}${item.expiryDate ? `, 유통기한: ${item.expiryDate}` : ''}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, '품번목록.txt');
  };

  // 공유하기
  const shareData = async () => {
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
      // 클립보드에 복사
      navigator.clipboard.writeText(content);
      alert('품번 목록이 클립보드에 복사되었습니다.');
    }
  };

  // 카메라 에러 처리
  const handleCameraError = () => {
    setErrorMessage('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
  };

  // 선택 영역 지우기
  const clearSelection = () => {
    setSelectionArea(null);
    setSelectionStart(null);
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
          
          {capturedImage ? (
            <div className="image-container">
              <div className="canvas-container">
                <canvas
                  ref={canvasRef2}
                  className="selection-canvas"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
                {selectionArea && (
                  <div className="selection-info">
                    <p>선택된 영역: {Math.round(selectionArea.width)} x {Math.round(selectionArea.height)}</p>
                  </div>
                )}
              </div>
              
              <div className="action-buttons">
                <button className="retake-btn" onClick={resetImage}>
                  🔄 다시 촬영
                </button>
                <button className="clear-selection-btn" onClick={clearSelection}>
                  🗑️ 선택 영역 지우기
                </button>
                <button 
                  className="capture-btn" 
                  onClick={processOCR}
                  disabled={isProcessing}
                >
                  🔍 텍스트 인식
                </button>
              </div>
            </div>
          ) : (
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
              <button className="capture-btn" onClick={captureScreenshot}>
                📸 촬영하기
              </button>
            </div>
          )}
          
          {errorMessage && (
            <div className="camera-error">
              <p>{errorMessage}</p>
            </div>
          )}
        </section>

        {/* 처리 중 표시 */}
        {isProcessing && (
          <div className="processing">
            <div className="loading-spinner"></div>
            <p>이미지를 분석하고 있습니다...</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        )}

        {/* 인식 결과 */}
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

        {/* 입력 폼 */}
        {selectedText && (
          <section className="input-section">
            <h2>📝 품번 정보 입력</h2>
            <div className="input-form">
              <div className="form-group">
                <label>품번:</label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="품번을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>수량:</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="수량을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>단위:</label>
                <select 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                >
                  {units.map(unitOption => (
                    <option key={unitOption} value={unitOption}>
                      {unitOption}
                    </option>
                  ))}
                </select>
                <button 
                  className="unit-edit-btn" 
                  onClick={() => setShowUnitEditor(true)}
                >
                  ✏️ 단위 편집
                </button>
              </div>
              
              <div className="form-group">
                <label>유통기한 (선택):</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
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
                    <div className="quantity">
                      {item.quantity}{item.unit}
                    </div>
                    {item.expiryDate && (
                      <div className="expiry-date">
                        유통기한: {item.expiryDate}
                      </div>
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
              <button className="share-btn" onClick={shareData}>
                📤 공유하기
              </button>
            </div>
          </section>
        )}

        {/* 단위 편집 팝업 */}
        {showUnitEditor && (
          <div className="unit-editor-popup">
            <div className="unit-editor-modal">
              <div className="unit-editor-header">
                <h3>단위 편집</h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowUnitEditor(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="unit-editor-content">
                <div className="add-unit-section">
                  <h4>새 단위 추가</h4>
                  <div className="add-unit-input">
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="새 단위 입력"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addUnit(newUnit);
                        }
                      }}
                    />
                    <button 
                      className="add-unit-btn" 
                      onClick={() => addUnit(newUnit)}
                      disabled={!newUnit.trim()}
                    >
                      추가
                    </button>
                  </div>
                </div>
                
                <div className="edit-units-section">
                  <h4>기존 단위 편집</h4>
                  <div className="units-list">
                    {units.map((unitItem, index) => (
                      <div key={index} className="unit-item">
                        {editingIndex === index ? (
                          <div className="unit-edit-mode">
                            <input
                              type="text"
                              value={editingUnit}
                              onChange={(e) => setEditingUnit(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  saveUnit();
                                }
                              }}
                            />
                            <button 
                              className="save-unit-btn" 
                              onClick={saveUnit}
                              disabled={!editingUnit.trim()}
                            >
                              저장
                            </button>
                            <button 
                              className="cancel-unit-btn" 
                              onClick={() => {
                                setEditingIndex(-1);
                                setEditingUnit('');
                              }}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="unit-display-mode">
                            <span className="unit-text">{unitItem}</span>
                            <div className="unit-actions">
                              <button 
                                className="edit-unit-btn" 
                                onClick={() => editUnit(index)}
                              >
                                ✏️
                              </button>
                              <button 
                                className="delete-unit-btn" 
                                onClick={() => deleteUnit(index)}
                                disabled={units.length <= 1}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 