# Tesseract.js 사용법 가이드

## 개요

Tesseract.js는 브라우저에서 직접 OCR(광학 문자 인식)을 수행할 수 있는 JavaScript 라이브러리입니다. 서버 없이 클라이언트에서 텍스트 인식이 가능합니다.

## 설치

```bash
npm install tesseract.js
```

## 기본 사용법

### 1. 기본 OCR 수행

```javascript
import Tesseract from 'tesseract.js';

// 기본 OCR
const performOCR = async (imageData) => {
  try {
    const result = await Tesseract.recognize(imageData, 'eng');
    console.log('인식된 텍스트:', result.data.text);
    return result.data.text;
  } catch (error) {
    console.error('OCR 오류:', error);
    throw error;
  }
};
```

### 2. 진행률 추적

```javascript
const performOCRWithProgress = async (imageData) => {
  try {
    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`진행률: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR 오류:', error);
    throw error;
  }
};
```

### 3. 고급 설정

```javascript
const performAdvancedOCR = async (imageData) => {
  try {
    const result = await Tesseract.recognize(imageData, 'eng', {
      // 문자 화이트리스트 (숫자와 영문만)
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      
      // 페이지 세그멘테이션 모드
      psm: 6, // 6: 균일한 텍스트 블록
      
      // 진행률 로깅
      logger: (m) => {
        console.log('OCR 상태:', m.status, m.progress);
      }
    });
    
    console.log('인식된 텍스트:', result.data.text);
    console.log('신뢰도:', result.data.confidence);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR 오류:', error);
    throw error;
  }
};
```

## 언어 설정

### 지원 언어

```javascript
// 영어 (기본)
await Tesseract.recognize(imageData, 'eng');

// 한국어
await Tesseract.recognize(imageData, 'kor');

// 영어 + 한국어
await Tesseract.recognize(imageData, 'eng+kor');

// 숫자만 인식 (커스텀)
await Tesseract.recognize(imageData, 'eng', {
  tessedit_char_whitelist: '0123456789'
});
```

## 이미지 전처리

### 이미지 형식

```javascript
// Base64 이미지
const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';

// File 객체
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

// Canvas 요소
const canvas = document.getElementById('canvas');
const imageData = canvas.toDataURL('image/jpeg');
```

### 이미지 최적화

```javascript
// 이미지 크기 조정
const optimizeImage = (imageData, maxWidth = 800) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 비율 유지하며 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // JPEG로 변환 (품질 0.8)
      const optimizedImage = canvas.toDataURL('image/jpeg', 0.8);
      resolve(optimizedImage);
    };
    img.src = imageData;
  });
};
```

## 성능 최적화

### 1. 워커 사용

```javascript
// 워커 초기화
const worker = await Tesseract.createWorker();

// 언어 로드
await worker.loadLanguage('eng');
await worker.initialize('eng');

// OCR 수행
const result = await worker.recognize(imageData);
console.log(result.data.text);

// 워커 종료
await worker.terminate();
```

### 2. 캐싱

```javascript
// 워커 재사용
let worker = null;

const getWorker = async () => {
  if (!worker) {
    worker = await Tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
  }
  return worker;
};

const performOCR = async (imageData) => {
  const worker = await getWorker();
  const result = await worker.recognize(imageData);
  return result.data.text;
};
```

## 오류 처리

```javascript
const performOCRWithErrorHandling = async (imageData) => {
  try {
    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m) => {
        if (m.status === 'error') {
          console.error('OCR 오류:', m);
        }
      }
    });
    
    return result.data.text;
  } catch (error) {
    console.error('OCR 처리 실패:', error);
    
    // 오류 타입별 처리
    if (error.message.includes('timeout')) {
      throw new Error('OCR 처리 시간이 초과되었습니다.');
    } else if (error.message.includes('network')) {
      throw new Error('네트워크 오류가 발생했습니다.');
    } else {
      throw new Error('텍스트 인식에 실패했습니다.');
    }
  }
};
```

## 실제 사용 예제

### 품번 인식 앱

```javascript
import Tesseract from 'tesseract.js';

class PartNumberOCR {
  constructor() {
    this.worker = null;
  }

  // 워커 초기화
  async initialize() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      
      // 숫자 인식에 최적화된 설정
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: 6
      });
    }
  }

  // 품번 인식
  async recognizePartNumber(imageData, onProgress) {
    await this.initialize();
    
    try {
      const result = await this.worker.recognize(imageData, {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(m.progress);
          }
        }
      });
      
      // 숫자만 추출
      const numbers = result.data.text.match(/\d+/g) || [];
      const validNumbers = numbers.filter(num => num.length >= 6 && num.length <= 12);
      
      return {
        text: result.data.text,
        numbers: validNumbers,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('품번 인식 실패:', error);
      throw error;
    }
  }

  // 워커 정리
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// 사용 예제
const ocr = new PartNumberOCR();

// 이미지에서 품번 인식
const recognizePartNumber = async (imageData) => {
  try {
    const result = await ocr.recognizePartNumber(imageData, (progress) => {
      console.log(`진행률: ${Math.round(progress * 100)}%`);
    });
    
    console.log('인식된 텍스트:', result.text);
    console.log('품번들:', result.numbers);
    console.log('신뢰도:', result.confidence);
    
    return result;
  } catch (error) {
    console.error('인식 실패:', error);
    throw error;
  }
};
```

## 주의사항

### 1. 성능
- 첫 실행 시 모델 다운로드로 인한 지연
- 큰 이미지는 처리 시간이 오래 걸림
- 모바일 기기에서는 성능이 제한적일 수 있음

### 2. 정확도
- 이미지 품질에 따라 정확도가 달라짐
- 조명, 각도, 해상도가 중요
- 숫자 인식은 영어 모델이 더 정확함

### 3. 브라우저 지원
- HTTPS 환경에서만 카메라 접근 가능
- 일부 오래된 브라우저에서는 지원되지 않을 수 있음

## 문제 해결

### 1. 모델 다운로드 실패
```javascript
// 수동으로 모델 다운로드
await Tesseract.createWorker({
  workerPath: 'https://unpkg.com/tesseract.js@v4/dist/worker.min.js',
  langPath: 'https://tessdata.projectnaptha.com/4.0.0',
  corePath: 'https://unpkg.com/tesseract.js-core@v4/tesseract-core.wasm.js'
});
```

### 2. 메모리 부족
```javascript
// 워커 종료로 메모리 해제
await worker.terminate();
```

### 3. 타임아웃 처리
```javascript
// 타임아웃 설정
const timeout = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('타임아웃')), 30000)
);

const result = await Promise.race([
  Tesseract.recognize(imageData, 'eng'),
  timeout
]);
```

## 참고 자료

- [Tesseract.js 공식 문서](https://tesseract.projectnaptha.com/)
- [GitHub 저장소](https://github.com/naptha/tesseract.js)
- [언어 데이터](https://github.com/tesseract-ocr/tessdata) 