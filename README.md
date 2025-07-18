# 모바일 품번 스캐너

Tesseract.js를 활용한 모바일 최적화 품번 인식 및 관리 PWA 앱입니다.

## 주요 기능

1. **카메라 촬영**: 안드로이드 휴대폰의 카메라를 사용하여 박스 촬영
2. **자동 OCR**: PaddleOCR을 사용한 숫자 자동 인식
3. **범위 선택**: 터치로 특정 범위의 숫자만 선택 가능
4. **품번 관리**: 인식된 숫자를 품번으로 저장
5. **수량 단위**: 카톤, 중포 등 다양한 단위 지원 및 편집 가능
6. **유통기한**: 선택적으로 8자리 유통기한 입력
7. **파일 저장**: 메모장 형식으로 품번 목록 저장
8. **공유 기능**: 결과를 다른 앱으로 공유

## 기술 스택

### 기술 스택
- React 18 + TypeScript
- Vite (빌드 도구)
- Tesseract.js (클라이언트 사이드 OCR)
- PWA (Progressive Web App)
- 모바일 최적화 UI/UX

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd project4
```

### 2. 프론트엔드 설정
```bash
cd part-number-manager
npm install
```

### 3. 프론트엔드 실행
```bash
npm run dev
```
프론트엔드가 `http://localhost:5173`에서 실행됩니다.

### 4. 브라우저에서 접속
```
http://localhost:5173
```

> **참고**: 백엔드 서버가 필요하지 않습니다. Tesseract.js를 사용하여 클라이언트에서 직접 OCR을 수행합니다.

## 사용 방법

### 1. 카메라 촬영
- 앱을 시작하면 카메라가 자동으로 활성화됩니다
- 박스의 품번이 보이도록 촬영합니다
- "촬영" 버튼을 클릭합니다

### 2. 텍스트 인식
- Tesseract.js가 이미지에서 숫자를 자동으로 인식합니다
- 인식된 텍스트가 화면에 표시됩니다
- 원하는 숫자가 아니면 "다시 촬영" 버튼을 클릭합니다

### 3. 범위 선택 (선택사항)
- 인식된 텍스트에서 원하는 부분을 마우스로 드래그하여 선택합니다
- 선택된 텍스트가 자동으로 품번 입력란에 입력됩니다

### 4. 품번 입력
- 품번: 인식된 숫자 또는 수동 입력
- 수량: 기본값 1, 필요시 변경
- 단위: 카톤, 중포, 개, 박스, kg 중 선택
- 유통기한: YYYYMMDD 형식으로 8자리 입력 (선택사항)
- "입력" 버튼을 클릭하여 목록에 추가

### 5. 단위 편집
- "단위 편집" 버튼을 클릭하여 새 단위를 추가할 수 있습니다
- 추가된 단위는 드롭다운 목록에 표시됩니다

### 6. 품번 목록 관리
- 추가된 품번들이 목록에 표시됩니다
- 각 품번 옆의 "삭제" 버튼으로 개별 삭제 가능

### 7. 저장 및 공유
- "저장" 버튼: 품번 목록을 텍스트 파일로 다운로드
- "공유" 버튼: 다른 앱으로 품번 목록 공유

## 저장 파일 형식

```
123456 2카톤
456789 3중포
987654123 5카톤 유통기한 20261203
```

## 클라이언트 사이드 OCR

### Tesseract.js 사용
- 브라우저에서 직접 OCR 수행
- 서버 불필요
- 오프라인에서도 작동
- 무료 사용

### OCR 처리 과정
1. 이미지 캡처
2. Tesseract.js로 텍스트 인식
3. 숫자 추출 (6-12자리)
4. 결과 표시

### 장점
- ✅ 서버 비용 없음
- ✅ 배포 간단 (정적 웹사이트)
- ✅ 오프라인 지원
- ✅ 개인정보 보호 (데이터가 서버로 전송되지 않음)

## 개발 환경 설정

### 프론트엔드 개발
```bash
cd part-number-manager
npm install
npm run dev
```

### 빌드
```bash
cd part-number-manager
npm run build
```

### 빌드
```bash
cd part-number-manager
npm run build
```

## 배포

### CloudType 배포 (권장)
1. [CloudType](https://cloudtype.io) 접속
2. GitHub 계정으로 로그인
3. 새 프로젝트 생성 → `sjouble/InventoryScanner` 선택
4. 프레임워크: `Vite` 선택
5. 자동 배포 완료

### 배포 설정
- **빌드 명령어**: `npm install && npm run build`
- **출력 디렉토리**: `part-number-manager/dist`
- **Node.js 버전**: `18`
- **자동 도메인**: `https://inventory-scanner.cloudtype.app`

### 다른 플랫폼 배포
- **Netlify**: `part-number-manager/dist` 배포
- **Vercel**: Vite 프레임워크 자동 감지
- **GitHub Pages**: `gh-pages` 브랜치 사용

## 문제 해결

### 카메라 접근 권한
- 브라우저에서 카메라 접근을 허용해야 합니다
- HTTPS 환경에서만 카메라 접근이 가능합니다

### OCR 인식 실패
- 이미지가 선명한지 확인
- 숫자가 잘 보이는지 확인
- 조명이 충분한지 확인
- 다시 촬영해보세요

### Tesseract.js 로딩
- 첫 실행 시 Tesseract.js 모델이 자동으로 다운로드됩니다
- 인터넷 연결이 필요합니다 (최초 1회만)

## 라이선스

MIT License

## 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 