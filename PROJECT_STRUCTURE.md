# 프로젝트 구조

```
project4/
├── README.md                    # 프로젝트 메인 README
├── PROJECT_STRUCTURE.md         # 이 파일 - 프로젝트 구조 설명
├── package.json                 # 프로젝트 루트 설정
├── start.bat                    # Windows 실행 스크립트
├── 아이디어                     # 원본 요구사항
│
├── backend/                     # 백엔드 (FastAPI + PaddleOCR)
│   ├── main.py                  # FastAPI 서버 메인 파일
│   └── requirements.txt         # Python 의존성
│
├── part-number-manager/         # 프론트엔드 (React + TypeScript)
│   ├── package.json             # Node.js 의존성
│   ├── vite.config.ts           # Vite 설정
│   ├── tsconfig.json            # TypeScript 설정
│   ├── index.html               # HTML 템플릿
│   ├── public/                  # 정적 파일
│   └── src/                     # 소스 코드
│       ├── App.tsx              # 메인 React 컴포넌트
│       ├── App.css              # 스타일시트
│       ├── main.tsx             # React 앱 진입점
│       └── vite-env.d.ts        # Vite 타입 정의
│
└── PaddleOCR/                   # PaddleOCR 라이브러리 (참조용)
    └── ...                      # PaddleOCR 소스 코드
```

## 파일별 역할

### 루트 디렉토리
- **README.md**: 프로젝트 전체 설명, 설치 방법, 사용법
- **PROJECT_STRUCTURE.md**: 프로젝트 구조 설명 (이 파일)
- **package.json**: 프로젝트 메타데이터 및 스크립트
- **start.bat**: Windows에서 쉽게 실행할 수 있는 배치 파일
- **아이디어**: 원본 요구사항 문서

### 백엔드 (`backend/`)
- **main.py**: FastAPI 서버 메인 파일
  - PaddleOCR 초기화 및 설정
  - OCR API 엔드포인트 (`/ocr/recognize-base64`)
  - 이미지 전처리 및 텍스트 인식
  - 품번 유효성 검사
- **requirements.txt**: Python 패키지 의존성
  - FastAPI, uvicorn, paddlepaddle, paddleocr 등

### 프론트엔드 (`part-number-manager/`)
- **package.json**: Node.js 패키지 의존성
  - React, TypeScript, Vite, react-webcam, file-saver 등
- **vite.config.ts**: Vite 빌드 도구 설정
- **tsconfig.json**: TypeScript 컴파일러 설정
- **index.html**: HTML 템플릿
- **src/App.tsx**: 메인 React 컴포넌트
  - 카메라 기능
  - OCR API 호출
  - 품번 관리 UI
  - 파일 저장 및 공유 기능
- **src/App.css**: 스타일시트
  - 반응형 디자인
  - 모던 UI 스타일
  - 애니메이션 효과

## 주요 기능 구현

### 1. 카메라 촬영
- **라이브러리**: `react-webcam`
- **위치**: `src/App.tsx` - `Webcam` 컴포넌트
- **기능**: 실시간 카메라 스트림, 스크린샷 캡처

### 2. OCR 텍스트 인식
- **백엔드**: `backend/main.py` - PaddleOCR API
- **프론트엔드**: `src/App.tsx` - `callOCRAPI` 함수
- **기능**: 이미지에서 숫자 자동 인식, 신뢰도 기반 필터링

### 3. 텍스트 선택
- **위치**: `src/App.tsx` - `handleTextSelection` 함수
- **기능**: 마우스 드래그로 특정 텍스트 선택

### 4. 품번 관리
- **위치**: `src/App.tsx` - `PartNumber` 인터페이스
- **기능**: 품번, 수량, 단위, 유통기한 관리

### 5. 파일 저장
- **라이브러리**: `file-saver`
- **위치**: `src/App.tsx` - `saveToFile` 함수
- **기능**: 텍스트 파일로 품번 목록 다운로드

### 6. 공유 기능
- **위치**: `src/App.tsx` - `shareContent` 함수
- **기능**: Web Share API 또는 클립보드 복사

## API 엔드포인트

### POST /ocr/recognize-base64
- **목적**: Base64 인코딩된 이미지에서 텍스트 인식
- **입력**: `{"image": "data:image/jpeg;base64,..."}`
- **출력**: 인식된 텍스트 및 품번 정보

### GET /health
- **목적**: 서버 상태 확인
- **출력**: 서버 상태 및 OCR 로드 상태

## 개발 환경

### 백엔드
- **언어**: Python 3.8+
- **프레임워크**: FastAPI
- **OCR**: PaddleOCR
- **포트**: 8000

### 프론트엔드
- **언어**: TypeScript
- **프레임워크**: React 18
- **빌드 도구**: Vite
- **포트**: 5173

## 실행 방법

### 전체 설치
```bash
npm run install:all
```

### 개발 서버 실행
```bash
npm run dev
```

### 개별 실행
```bash
# 백엔드만
npm run dev:backend

# 프론트엔드만
npm run dev:frontend
```

### Windows에서 쉽게 실행
```bash
start.bat
```

## 배포

### Render 배포
1. GitHub에 코드 푸시
2. Render에서 Web Service 생성
3. 빌드 명령어 설정
4. 자동 배포

### 로컬 빌드
```bash
npm run build
```

## 기술 스택 요약

| 분야 | 기술 | 버전 |
|------|------|------|
| 프론트엔드 | React | 18.x |
| 프론트엔드 | TypeScript | 5.x |
| 프론트엔드 | Vite | 5.x |
| 백엔드 | FastAPI | 0.104.x |
| 백엔드 | PaddleOCR | 2.7.x |
| 백엔드 | Python | 3.8+ |
| 카메라 | react-webcam | 7.x |
| 파일 처리 | file-saver | 2.x | 