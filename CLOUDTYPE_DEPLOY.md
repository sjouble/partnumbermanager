# CloudType 배포 가이드

## 📋 CloudType 배포 설정

### 1. CloudType 계정 생성
- [CloudType](https://cloudtype.io) 접속
- GitHub 계정으로 로그인

### 2. 프로젝트 연결
1. **"새 프로젝트 생성"** 클릭
2. **GitHub 저장소 선택**: `sjouble/InventoryScanner`
3. **프로젝트 이름**: `inventory-scanner`
4. **프레임워크**: `Vite` 선택

### 3. 빌드 설정
- **빌드 명령어**: `npm install && npm run build`
- **출력 디렉토리**: `part-number-manager/dist`
- **Node.js 버전**: `18`

### 4. 환경 변수
```
NODE_ENV=production
```

### 5. 도메인 설정
- **자동 도메인**: `https://inventory-scanner.cloudtype.app`
- **커스텀 도메인**: 원하는 도메인 설정 가능

## 🚀 배포 과정

### 자동 배포
- GitHub에 푸시하면 자동 배포
- main 브랜치 변경 시 자동 빌드

### 수동 배포
```bash
# 로컬에서 빌드
npm run build

# CloudType 대시보드에서 수동 배포
```

## 📱 PWA 설정

### 서비스 워커
- `sw.js` 파일이 자동으로 캐싱됨
- 오프라인 지원 활성화

### 매니페스트
- `manifest.json` 파일이 자동으로 인식됨
- 홈 화면 설치 가능

## 🔧 문제 해결

### 빌드 실패
1. **Node.js 버전 확인**: 18 이상
2. **의존성 설치 확인**: `npm install` 성공 여부
3. **빌드 로그 확인**: CloudType 대시보드에서 확인

### 배포 실패
1. **GitHub 연결 확인**: 저장소 접근 권한
2. **브랜치 확인**: main 브랜치 사용
3. **파일 경로 확인**: `part-number-manager/dist` 존재

## 📊 성능 최적화

### 코드 분할
- React, React-DOM: vendor 청크
- Tesseract.js: 별도 청크
- 자동 캐싱 최적화

### 캐싱 전략
- 정적 파일: 1년 캐싱
- 서비스 워커: no-cache
- 매니페스트: no-cache

## 🌐 접속 URL

### 기본 도메인
```
https://inventory-scanner.cloudtype.app
```

### 커스텀 도메인 (설정 시)
```
https://your-domain.com
```

## 📞 지원

### CloudType 지원
- [CloudType 문서](https://docs.cloudtype.io)
- [CloudType 커뮤니티](https://community.cloudtype.io)

### 프로젝트 이슈
- GitHub Issues에서 문의
- 이메일: [your-email@example.com] 