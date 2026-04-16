#!/bin/bash
# ─────────────────────────────────────────────────────────────
# FDC AI Dashboard — Windows 배포 패키지 생성 스크립트
# 실행: bash scripts/package-release.sh
# 결과: fdc-ai-dashboard-win.zip (윈도우에서 start.bat 더블클릭)
#
# 폐쇄망 대응: Node.js 포터블을 ZIP 안에 포함
# ─────────────────────────────────────────────────────────────

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

RELEASE_DIR="$PROJECT_DIR/release"
PACKAGE_NAME="fdc-ai-dashboard"
ZIP_NAME="${PACKAGE_NAME}-win.zip"

NODE_VER="v22.16.0"
NODE_ZIP_NAME="node-${NODE_VER}-win-x64.zip"
NODE_CACHE="/tmp/node-win-x64.zip"
NODE_URL="https://nodejs.org/dist/${NODE_VER}/${NODE_ZIP_NAME}"

echo "=========================================="
echo "  FDC AI Dashboard — Release Packager"
echo "  (폐쇄망 대응 — Node.js 포함)"
echo "=========================================="
echo ""

# ── 0. Node.js 포터블 다운로드 (캐시 사용) ──
if [ -f "$NODE_CACHE" ]; then
    echo "[0/5] Node.js 포터블: 캐시 사용 ($NODE_CACHE)"
else
    echo "[0/5] Node.js 포터블 다운로드 중..."
    curl -L -o "$NODE_CACHE" "$NODE_URL"
fi
echo ""

# ── 1. 빌드 ──
echo "[1/5] Next.js 프로덕션 빌드..."
npm run build
echo ""

# ── 2. 릴리즈 폴더 구성 ──
echo "[2/5] 릴리즈 폴더 구성..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/$PACKAGE_NAME"

DEST="$RELEASE_DIR/$PACKAGE_NAME"

# standalone 서버 복사
cp -r .next/standalone/* "$DEST/"

# static 파일 복사 (standalone에는 포함 안 됨)
mkdir -p "$DEST/.next/static"
cp -r .next/static/* "$DEST/.next/static/"

# public 폴더 복사
if [ -d "public" ]; then
    cp -r public "$DEST/public"
fi

# 실행 스크립트 복사
cp scripts/start.bat "$DEST/start.bat"

# ── 3. Node.js 포터블 번들링 ──
echo "[3/5] Node.js 포터블 번들링..."
TEMP_NODE="/tmp/node-extract-$$"
mkdir -p "$TEMP_NODE"
cd "$TEMP_NODE"
unzip -q "$NODE_CACHE"
# node-v22.x.x-win-x64 폴더 → DEST/node 로 복사
NODE_EXTRACTED=$(ls -d node-*-win-x64 2>/dev/null | head -1)
if [ -n "$NODE_EXTRACTED" ]; then
    mkdir -p "$DEST/node"
    cp "$NODE_EXTRACTED/node.exe" "$DEST/node/"
    # npm/npx는 불필요 — server.js만 실행하면 되므로 node.exe만 포함
    echo "  node.exe 포함 완료 ($(du -sh "$DEST/node/node.exe" | cut -f1))"
else
    echo "[WARN] Node.js 압축 해제 실패 — node.exe 미포함"
fi
rm -rf "$TEMP_NODE"
cd "$PROJECT_DIR"
echo ""

# ── 4. README 생성 ──
echo "[4/5] README 생성..."
cat > "$DEST/README.txt" << 'READMEEOF'
============================================
  FDC AI Dashboard
  반도체 FDC 이상탐지 + AI 분석 대시보드
============================================

실행 방법 (폐쇄망 OK, 인터넷 불필요)
--------------------------------------
1. start.bat 더블클릭
2. 자동으로 브라우저가 열립니다 (http://localhost:3020)
3. 종료: 검은 창(터미널)을 닫으면 됩니다

※ Node.js가 이미 포함되어 있어 별도 설치 불필요

AI 분석 기능 사용
-----------------
- LLM API 키가 필요합니다 (Gemini, OpenAI 등)
- 대시보드 좌측 하단 설정에서 API 키 입력
- 폐쇄망에서는 내부 vLLM/Ollama 서버 주소 입력
  (예: http://내부서버:8000/v1)

포트 변경
---------
- start.bat를 메모장으로 열어서 PORT=3020 값 수정

============================================
READMEEOF

# ── 5. ZIP 생성 ──
echo "[5/5] ZIP 패키지 생성..."
cd "$RELEASE_DIR"
rm -f "$PROJECT_DIR/$ZIP_NAME"

if command -v zip &> /dev/null; then
    zip -r -q "$PROJECT_DIR/$ZIP_NAME" "$PACKAGE_NAME" -x "*.DS_Store"
else
    tar -czf "$PROJECT_DIR/${PACKAGE_NAME}-win.tar.gz" "$PACKAGE_NAME"
    echo "  (zip 미설치 — tar.gz로 생성)"
fi

cd "$PROJECT_DIR"

# 크기 표시
if [ -f "$ZIP_NAME" ]; then
    SIZE=$(du -sh "$ZIP_NAME" | cut -f1)
    echo ""
    echo "=========================================="
    echo "  완료! $ZIP_NAME ($SIZE)"
    echo "=========================================="
    echo ""
    echo "  배포 방법:"
    echo "  1. $ZIP_NAME → USB/공유폴더로 윈도우 PC에 전송"
    echo "  2. 압축 해제"
    echo "  3. start.bat 더블클릭"
    echo "  4. 인터넷 불필요 (Node.js 내장)"
    echo ""
elif [ -f "${PACKAGE_NAME}-win.tar.gz" ]; then
    SIZE=$(du -sh "${PACKAGE_NAME}-win.tar.gz" | cut -f1)
    echo "  완료! ${PACKAGE_NAME}-win.tar.gz ($SIZE)"
fi

# 정리
rm -rf "$RELEASE_DIR"
echo "완료."
