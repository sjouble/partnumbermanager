# PartNumberManager

React Native + Expo로 구현된 파트넘버 관리 앱입니다.

## 🚀 주요 기능

- 📸 **카메라 스캔**: 파트넘버를 카메라로 촬영
- 🖼️ **갤러리 선택**: 기존 이미지에서 파트넘버 선택
- 🔍 **OCR 처리**: Tesseract.js를 사용한 텍스트 인식
- 📝 **파트넘버 관리**: 수량, 단위, 유통기한 관리
- 📊 **데이터 내보내기**: 텍스트 파일로 데이터 저장 및 공유
- ⚙️ **단위 관리**: 사용자 정의 단위 추가/수정/삭제

## 🛠️ 기술 스택

- **React Native**: 크로스 플랫폼 모바일 앱 개발
- **Expo**: 개발 환경 및 배포 플랫폼
- **TypeScript**: 타입 안전성
- **Tesseract.js**: OCR 텍스트 인식
- **Expo Camera**: 카메라 기능
- **Expo Image Picker**: 갤러리 접근
- **Expo File System**: 파일 시스템 접근
- **Expo Sharing**: 데이터 공유

## 📱 지원 플랫폼

- ✅ **iOS**: iPhone, iPad
- ✅ **Android**: 모든 Android 기기
- ✅ **Web**: 브라우저에서 실행 가능

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 시작
```bash
npm start
```

### 3. 플랫폼별 실행
```bash
# Android
npm run android

# iOS (macOS 필요)
npm run ios

# Web
npm run web
```

## 📋 사용 방법

### 카메라 스캔
1. 앱을 실행하고 "촬영" 버튼을 탭
2. 파트넘버가 포함된 이미지를 촬영
3. "OCR 처리" 버튼을 탭하여 텍스트 인식
4. 인식된 텍스트를 확인하고 수정
5. "파트넘버 추가" 버튼을 탭하여 목록에 추가

### 갤러리에서 선택
1. "갤러리" 버튼을 탭
2. 기존 이미지에서 파트넘버가 포함된 사진 선택
3. OCR 처리 및 파트넘버 추가

### 파트넘버 관리
- 수량, 단위, 유통기한 수정 가능
- 개별 파트넘버 삭제 가능
- 데이터 내보내기로 텍스트 파일 생성

### 단위 관리
- 기본 단위: 개, EA, PCS, BOX, SET
- 사용자 정의 단위 추가/수정/삭제 가능

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn
- Expo CLI
- Android Studio (Android 개발용)
- Xcode (iOS 개발용, macOS만)

### 권한 설정
앱은 다음 권한이 필요합니다:
- 카메라 접근
- 갤러리 접근
- 파일 시스템 접근

## 📦 배포

### Expo Go 앱으로 테스트
1. Expo Go 앱을 스마트폰에 설치
2. QR 코드를 스캔하여 앱 실행

### 네이티브 앱 빌드
```bash
# Android APK 빌드
expo build:android

# iOS IPA 빌드 (macOS 필요)
expo build:ios
```

### 웹 배포
```bash
# 웹 빌드
expo build:web

# 정적 사이트로 배포 가능
```

## 🎯 장점

### 기존 웹 버전 대비
- ✅ **브라우저 호환성 문제 해결**: 네이티브 앱으로 모든 브라우저에서 일관된 동작
- ✅ **카메라 접근 안정성**: 네이티브 카메라 API 사용으로 안정적인 카메라 기능
- ✅ **성능 향상**: 네이티브 성능으로 빠른 OCR 처리
- ✅ **오프라인 지원**: 인터넷 없이도 모든 기능 사용 가능
- ✅ **앱스토어 배포**: App Store, Google Play 배포 가능

## 🔄 마이그레이션

### 웹 버전에서 React Native로
- 기존 웹 버전의 기능을 모두 React Native로 이전
- 카메라 및 OCR 기능을 네이티브 API로 최적화
- UI/UX를 모바일 친화적으로 개선

## 📄 라이선스

MIT License

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

**개발자**: PartNumberManager Team  
**버전**: 2.0.0 (React Native)  
**최종 업데이트**: 2024년 7월
