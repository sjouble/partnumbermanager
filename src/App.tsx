import React, { useState, useRef, useCallback, useEffect } from 'react';
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

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [newUnit, setNewUnit] = useState<string>('');
  const [editingUnit, setEditingUnit] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [cameraError, setCameraError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionArea, setSelectionArea] = useState<SelectionArea | null>(null);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setCameraError('');
      setSelectionArea(null);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setRecognizedText('');
    setSelectedText('');
    setCurrentPartNumber('');
    setCurrentQuantity('');
    setCurrentExpiryDate('');
    setSelectionArea(null);
    setDrawingStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawingStart({ x, y });
    setSelectionArea(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingStart || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = x - drawingStart.x;
    const height = y - drawingStart.y;
    
    setSelectionArea({
      x: width > 0 ? drawingStart.x : x,
      y: height > 0 ? drawingStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDrawingStart(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // 두 손가락 터치인 경우 선택 모드를 비활성화하고 스크롤 허용
    if (e.touches.length >= 2) {
      setIsDrawing(false);
      setDrawingStart(null);
      setSelectionArea(null);
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawingStart({ x, y });
    setSelectionArea(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // 두 손가락 터치인 경우 스크롤 허용
    if (e.touches.length >= 2) {
      return;
    }
    
    if (!isDrawing || !drawingStart || !canvasRef.current) return;
    
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const width = x - drawingStart.x;
    const height = y - drawingStart.y;
    
    setSelectionArea({
      x: width > 0 ? drawingStart.x : x,
      y: height > 0 ? drawingStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // 두 손가락 터치가 끝난 경우에도 선택 모드 비활성화
    if (e.touches.length >= 2) {
      setIsDrawing(false);
      setDrawingStart(null);
      return;
    }
    
    setIsDrawing(false);
    setDrawingStart(null);
  };

  // 캔버스에 선택 영역 그리기
  useEffect(() => {
    if (!canvasRef.current || !capturedImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 크기를 이미지에 맞춤
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0);
      
      // 선택 영역 그리기
      if (selectionArea) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height);
        
        // 반투명 배경
        ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
        ctx.fillRect(selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height);
      }
    };
    img.src = capturedImage;
  }, [capturedImage, selectionArea]);

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker('kor+eng');
      
      setProgress(20);
      
      // Tesseract 설정 최적화
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허기니디리미비시이지치키티피히구누두루무부수우주추쿠투푸후그느드르므브스으즈츠크트프흐긔늬듸리미비시이지치키티피히그느드르므브스으즈츠크트프흐기니디리미비시이지치키티피히구누두루무부수우주추쿠투푸후그느드르므브스으즈츠크트프흐',
        tessedit_pageseg_mode: '6', // 균등한 텍스트 블록
        tessedit_ocr_engine_mode: '3', // 기본 OCR 엔진
        preserve_interword_spaces: '1',
        textord_heavy_nr: '1',
        textord_min_linesize: '2.5'
      });
      
      setProgress(40);
      
      let imageToProcess = capturedImage;
      
      // 선택 영역이 있으면 해당 영역만 크롭
      if (selectionArea && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          if (croppedCtx) {
            croppedCanvas.width = selectionArea.width;
            croppedCanvas.height = selectionArea.height;
            
            croppedCtx.drawImage(
              canvas,
              selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height,
              0, 0, selectionArea.width, selectionArea.height
            );
            
            imageToProcess = croppedCanvas.toDataURL('image/jpeg', 0.9);
          }
        }
      }
      
      setProgress(60);
      
      const { data: { text } } = await worker.recognize(imageToProcess);
      
      setProgress(100);
      
      // 텍스트 후처리로 정확도 향상
      const cleanedText = text
        .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
        .replace(/\s+/g, ' ') // 연속된 공백을 하나로
        .trim();
      
      setRecognizedText(cleanedText);
      
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
    setNewUnit('');
    setShowUnitEditor(false);
  };

  const editUnit = (index: number) => {
    setEditingIndex(index);
    setEditingUnit(customUnits[index]);
  };

  const updateUnit = () => {
    if (editingUnit.trim() && editingIndex >= 0) {
      const updatedUnits = [...customUnits];
      updatedUnits[editingIndex] = editingUnit.trim();
      setCustomUnits(updatedUnits);
    }
    setEditingIndex(-1);
    setEditingUnit('');
  };

  const deleteUnit = (index: number) => {
    if (index >= 0 && customUnits.length > 1) {
      const updatedUnits = customUnits.filter((_, i) => i !== index);
      setCustomUnits(updatedUnits);
      // 현재 선택된 단위가 삭제된 경우 첫 번째 단위로 변경
      if (currentUnit === customUnits[index]) {
        setCurrentUnit(updatedUnits[0]);
      }
    }
  };

  const openUnitEditor = () => {
    setShowUnitEditor(true);
    setNewUnit('');
    setEditingIndex(-1);
    setEditingUnit('');
  };

  const closeUnitEditor = () => {
    setShowUnitEditor(false);
    setNewUnit('');
    setEditingIndex(-1);
    setEditingUnit('');
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

  const clearSelection = () => {
    setSelectionArea(null);
    setDrawingStart(null);
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
              <div className="canvas-container">
                <canvas
                  ref={canvasRef}
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
                <button className="retake-btn" onClick={retake}>
                  🔄 다시 촬영
                </button>
                <button className="clear-selection-btn" onClick={clearSelection}>
                  🗑️ 선택 영역 지우기
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
                  onClick={openUnitEditor}
                >
                  ✏️ 단위 편집
                </button>
              </div>
              
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

        {/* 단위 편집 팝업 */}
        {showUnitEditor && (
          <div className="unit-editor-popup">
            <div className="unit-editor-modal">
              <div className="unit-editor-header">
                <h3>단위 편집</h3>
                <button className="close-btn" onClick={closeUnitEditor}>
                  ✕
                </button>
              </div>
              
              <div className="unit-editor-content">
                {/* 새 단위 추가 */}
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
                          addCustomUnit(newUnit);
                        }
                      }}
                    />
                    <button 
                      className="add-unit-btn"
                      onClick={() => addCustomUnit(newUnit)}
                      disabled={!newUnit.trim()}
                    >
                      추가
                    </button>
                  </div>
                </div>

                {/* 기존 단위 편집 */}
                <div className="edit-units-section">
                  <h4>기존 단위 편집</h4>
                  <div className="units-list">
                    {customUnits.map((unit, index) => (
                      <div key={index} className="unit-item">
                        {editingIndex === index ? (
                          <div className="unit-edit-mode">
                            <input
                              type="text"
                              value={editingUnit}
                              onChange={(e) => setEditingUnit(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateUnit();
                                }
                              }}
                            />
                            <button 
                              className="save-unit-btn"
                              onClick={updateUnit}
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
                            <span className="unit-text">{unit}</span>
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
                                disabled={customUnits.length <= 1}
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
