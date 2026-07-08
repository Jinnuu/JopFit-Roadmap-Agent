#!/bin/bash

# 1. 출력 폴더 설정 및 초기화
OUTPUT_DIR="scp"
mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/*

echo "=== [AI Agent 프로젝트] 모듈별 분할 덤프 시작 ==="
echo "📁 저장 위치: ./$OUTPUT_DIR/"
echo "---------------------------------------------------"

# 공통 함수: 파일 상단에 트리 구조 박기
write_tree_header() {
    local target_file="$1"
    echo "==================================================" > "$target_file"
    echo " PROJECT DIRECTORY STRUCTURE" >> "$target_file"
    echo "==================================================" >> "$target_file"
    
    if command -v tree &> /dev/null; then
        tree -I ".git|__pycache__|node_modules|venv|$OUTPUT_DIR|*Desktop*" >> "$target_file"
    else
        find . -maxdepth 3 \
            -not -path '*/.*' \
            -not -path '*__pycache__*' \
            -not -path "*$OUTPUT_DIR*" \
            -not -path "*Desktop*" >> "$target_file"
    fi
    echo -e "\n\n" >> "$target_file"
}

# 2. 📄 모든 문서 파일(.md) 합본 생성 (루트 md + docs 폴더 내 md 전체)
DOCS_FILE="$OUTPUT_DIR/project_context_docs.txt"
write_tree_header "$DOCS_FILE"

echo "📄 문서 파일(.md) 모으는 중..."
find . -type f -name "*.md" \
    -not -path "*/.*" \
    -not -path "*$OUTPUT_DIR*" \
    -not -path "*Desktop*" | sort | while read -r file; do
    
    echo "==================================================" >> "$DOCS_FILE"
    echo " FILE: $file" >> "$DOCS_FILE"
    echo "==================================================" >> "$DOCS_FILE"
    cat "$file" >> "$DOCS_FILE" 2>/dev/null
    echo -e "\n\n# END OF FILE: $file\n" >> "$DOCS_FILE"
done

# 3. 📦 핵심 소스 코드 (src/ 폴더 내부) 덤프 생성
SRC_FILE="$OUTPUT_DIR/project_context_src.txt"
write_tree_header "$SRC_FILE"

echo "📦 핵심 소스 코드(src) 모으는 중..."
find ./src -type f \
    -not -path '*/.*' \
    -not -path '*__pycache__*' \
    -not -name "*.md" | sort | while read -r file; do

    if file "$file" | grep -qE 'text|empty'; then
        echo "==================================================" >> "$SRC_FILE"
        echo " FILE: $file" >> "$SRC_FILE"
        echo "==================================================" >> "$SRC_FILE"
        cat "$file" >> "$SRC_FILE" 2>/dev/null
        echo -e "\n\n# END OF FILE: $file\n" >> "$SRC_FILE"
    fi
done

# 4. ⚙️ 루트 파일 설정 (app.py, requirements.txt, LICENSE 등)
ROOT_FILE="$OUTPUT_DIR/project_context_root.txt"
write_tree_header "$ROOT_FILE"

echo "⚙️ 루트 설정 및 구동 파일 모으는 중..."
find . -maxdepth 1 -type f \
    -not -path '*/.*' \
    -not -name "$OUTPUT_DIR" \
    -not -name "$(basename "$0")" \
    -not -name "*.md" \
    -not -name "project_context.txt" \
    -not -name "project_dump.md" | sort | while read -r file; do

    if file "$file" | grep -qE 'text|empty'; then
        echo "==================================================" >> "$ROOT_FILE"
        echo " FILE: $file" >> "$ROOT_FILE"
        echo "==================================================" >> "$ROOT_FILE"
        cat "$file" >> "$ROOT_FILE" 2>/dev/null
        echo -e "\n\n# END OF FILE: $file\n" >> "$ROOT_FILE"
    fi
done

echo "---------------------------------------------------"
echo "✨ 분할 완료! 생성된 덤프 파일 목록:"
ls -lh "$OUTPUT_DIR"
