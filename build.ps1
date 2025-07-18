# CloudType 빌드 스크립트 (PowerShell)
Write-Host "🚀 CloudType 빌드 시작..." -ForegroundColor Green

# part-number-manager 디렉토리로 이동
Set-Location part-number-manager

# 의존성 설치
Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
npm install

# 빌드 실행
Write-Host "🔨 빌드 실행 중..." -ForegroundColor Yellow
npm run build

# 빌드 결과 확인
if (Test-Path "dist") {
    Write-Host "✅ 빌드 성공! dist 폴더가 생성되었습니다." -ForegroundColor Green
    Get-ChildItem dist
} else {
    Write-Host "❌ 빌드 실패! dist 폴더가 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host "🎉 CloudType 빌드 완료!" -ForegroundColor Green 