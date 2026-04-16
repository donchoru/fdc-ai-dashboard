@echo off
chcp 65001 >nul 2>&1
title FDC AI Dashboard

echo.
echo   ============================================
echo     FDC AI Dashboard
echo     반도체 FDC 이상탐지 + AI 분석 대시보드
echo   ============================================
echo.

:: ── 포트 설정 (변경 가능) ──
set PORT=3020

:: ── Node.js 탐색 ──

:: 1) 같은 폴더의 node\node.exe (폐쇄망용 — 패키지에 포함)
if exist "%~dp0node\node.exe" (
    set "NODE_EXE=%~dp0node\node.exe"
    echo   [OK] 내장 Node.js 사용
    goto :start_server
)

:: 2) 시스템 PATH의 node
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "NODE_EXE=node"
    echo   [OK] 시스템 Node.js 사용
    goto :start_server
)

:: 3) 못 찾음
echo.
echo   [ERROR] Node.js를 찾을 수 없습니다.
echo.
echo   해결 방법:
echo     1. https://nodejs.org 에서 Node.js LTS 설치
echo     2. 또는 node-v22-win-x64.zip 압축 해제 후
echo        이 폴더 안에 node\ 폴더로 넣기
echo        (node\node.exe 가 있으면 됩니다)
echo.
pause
exit /b 1

:start_server
echo.
echo   서버 시작 중... (포트: %PORT%)
echo   종료하려면 이 창을 닫으세요.
echo   ============================================
echo.

:: 2초 후 브라우저 자동 오픈
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%PORT%/dashboard"

:: 서버 실행
cd /d "%~dp0"
set "NODE_ENV=production"
set "PORT=%PORT%"
set "HOSTNAME=0.0.0.0"
"%NODE_EXE%" server.js

pause
