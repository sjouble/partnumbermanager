from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import base64
import io
from PIL import Image
import numpy as np
import cv2
from paddleocr import PaddleOCR
import re
import os

app = FastAPI(title="품번 정리 OCR API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PaddleOCR 초기화
ocr = PaddleOCR(use_angle_cls=True, lang='ko', use_gpu=False)

def preprocess_image(image):
    """이미지 전처리"""
    # PIL Image를 numpy array로 변환
    if isinstance(image, Image.Image):
        image = np.array(image)
    
    # BGR to RGB 변환 (OpenCV는 BGR 사용)
    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    return image

def extract_numbers(text):
    """텍스트에서 숫자만 추출"""
    # 숫자만 추출하는 정규표현식
    numbers = re.findall(r'\d+', text)
    return numbers

def is_valid_part_number(text):
    """품번 유효성 검사"""
    # 숫자로만 구성된 6-12자리 문자열
    return bool(re.match(r'^\d{6,12}$', text.strip()))

@app.get("/")
async def root():
    return {"message": "품번 정리 OCR API 서버가 실행 중입니다."}

@app.post("/ocr/recognize")
async def recognize_text(file: UploadFile = File(...)):
    """이미지에서 텍스트 인식"""
    try:
        # 파일 확장자 검사
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")
        
        # 이미지 읽기
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # 이미지 전처리
        processed_image = preprocess_image(image)
        
        # OCR 실행
        results = ocr.ocr(processed_image, cls=True)
        
        # 결과 파싱
        recognized_texts = []
        part_numbers = []
        
        if results and results[0]:
            for line in results[0]:
                if line and len(line) >= 2:
                    text = line[1][0]  # 인식된 텍스트
                    confidence = line[1][1]  # 신뢰도
                    
                    if text and confidence > 0.5:  # 신뢰도 50% 이상만
                        recognized_texts.append(text)
                        
                        # 숫자만 추출
                        numbers = extract_numbers(text)
                        for number in numbers:
                            if is_valid_part_number(number):
                                part_numbers.append({
                                    "number": number,
                                    "original_text": text,
                                    "confidence": float(confidence)
                                })
        
        return JSONResponse({
            "success": True,
            "recognized_texts": recognized_texts,
            "part_numbers": part_numbers,
            "full_text": "\n".join(recognized_texts)
        })
        
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

@app.post("/ocr/recognize-base64")
async def recognize_text_base64(data: dict):
    """Base64 인코딩된 이미지에서 텍스트 인식"""
    try:
        # Base64 디코딩
        image_data = base64.b64decode(data["image"].split(',')[1])
        image = Image.open(io.BytesIO(image_data))
        
        # 이미지 전처리
        processed_image = preprocess_image(image)
        
        # OCR 실행
        results = ocr.ocr(processed_image, cls=True)
        
        # 결과 파싱
        recognized_texts = []
        part_numbers = []
        
        if results and results[0]:
            for line in results[0]:
                if line and len(line) >= 2:
                    text = line[1][0]  # 인식된 텍스트
                    confidence = line[1][1]  # 신뢰도
                    
                    if text and confidence > 0.5:  # 신뢰도 50% 이상만
                        recognized_texts.append(text)
                        
                        # 숫자만 추출
                        numbers = extract_numbers(text)
                        for number in numbers:
                            if is_valid_part_number(number):
                                part_numbers.append({
                                    "number": number,
                                    "original_text": text,
                                    "confidence": float(confidence)
                                })
        
        return JSONResponse({
            "success": True,
            "recognized_texts": recognized_texts,
            "part_numbers": part_numbers,
            "full_text": "\n".join(recognized_texts)
        })
        
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {"status": "healthy", "ocr_loaded": ocr is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 