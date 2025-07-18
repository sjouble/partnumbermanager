import Tesseract from 'tesseract.js';

// 기본 OCR 함수
export const performBasicOCR = async (imageData: string): Promise<string> => {
  try {
    const result = await Tesseract.recognize(imageData, 'eng');
    return result.data.text;
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    throw new Error('텍스트 인식에 실패했습니다.');
  }
};

// 진행률을 추적하는 OCR 함수
export const performOCRWithProgress = async (
  imageData: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      }
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    throw new Error('텍스트 인식에 실패했습니다.');
  }
};

// 숫자만 추출하는 함수
export const extractNumbers = (text: string): string[] => {
  const numbers = text.match(/\d+/g) || [];
  return numbers.filter(num => num.length >= 6 && num.length <= 12); // 6-12자리 숫자만
};

// 품번 유효성 검사
export const isValidPartNumber = (text: string): boolean => {
  return /^\d{6,12}$/.test(text.trim());
};

// OCR 설정 옵션
export const OCR_OPTIONS = {
  // 언어 설정
  lang: 'eng', // 영어 (숫자 인식에 최적화)
  
  // 이미지 전처리 옵션
  tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  
  // 신뢰도 임계값
  min_confidence: 30,
  
  // 페이지 세그멘테이션 모드
  psm: 6, // 6: 균일한 텍스트 블록
};

// 고급 OCR 함수 (설정 옵션 포함)
export const performAdvancedOCR = async (
  imageData: string,
  options: Partial<typeof OCR_OPTIONS> = {}
): Promise<{ text: string; confidence: number }> => {
  try {
    const result = await Tesseract.recognize(imageData, options.lang || 'eng', {
      ...options,
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`진행률: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    throw new Error('텍스트 인식에 실패했습니다.');
  }
}; 