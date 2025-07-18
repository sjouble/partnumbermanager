@echo off
echo 품번 정리 앱을 시작합니다...
echo.

echo 클라이언트 사이드 OCR 앱입니다. 서버가 필요하지 않습니다.
echo.

echo 프론트엔드를 시작합니다...
start "Frontend Server" cmd /k "cd part-number-manager && npm run dev"

echo.
echo 서버가 시작되었습니다!
echo 프론트엔드: http://localhost:5173
echo.
echo 브라우저에서 http://localhost:5173 을 열어주세요.
echo.
echo 참고: Tesseract.js를 사용하여 클라이언트에서 직접 OCR을 수행합니다.
pause 