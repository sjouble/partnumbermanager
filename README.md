# 모바일 품번 스캐너

Tesseract.js를 활용한 모바일 최적화 품번 인식 및 관리 PWA 앱입니다.

## 🌐 배포된 사이트

**GitHub Pages**: https://[your-username].github.io/partnumbermanager/

## 🚀 배포 방법

### GitHub Pages 배포

1. **저장소 설정**
   - GitHub 저장소의 Settings → Pages
   - Source를 "Deploy from a branch"로 설정
   - Branch를 "gh-pages"로 설정

2. **로컬 배포**
   ```bash
   # 의존성 설치
   npm install
   
   # 빌드 및 배포
   npm run deploy
   ```

3. **자동 배포 설정**
   - GitHub Actions를 사용하여 main 브랜치 푸시 시 자동 배포
   - `.github/workflows/deploy.yml` 파일 생성 필요

## 주요 기능

1. **카메라 촬영**: 모바일 카메라를 사용하여 박스 촬영
2. **자동 OCR**: Tesseract.js를 사용한 숫자 자동 인식
3. **범위 선택**: 터치로 특정 범위의 숫자만 선택 가능
4. **품번 관리**: 인식된 숫자를 품번으로 저장
5. **수량 단위**: 카톤, 중포 등 다양한 단위 지원 및 편집 가능
6. **유통기한**: 선택적으로 8자리 유통기한 입력
7. **파일 저장**: 메모장 형식으로 품번 목록 저장
8. **공유 기능**: 결과를 다른 앱으로 공유

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
