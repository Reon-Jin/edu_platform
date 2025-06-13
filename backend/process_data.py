# process_word.py
# 将 Word (.docx 和 .doc) 文档目录转换为若干长文本段落的 TXT 文件，便于语义检索
# 支持递归子目录，保持输出目录结构一致
# 对 .docx 使用 python-docx，对 .doc 使用 antiword 或 Windows COM（pywin32）

import os
import re
import subprocess
from docx import Document

# ====== 配置区域 ======
INPUT_DIR = "word_files"       # Word 文档根目录（支持 .docx 和 .doc）
OUTPUT_DIR = "knowledge"  # 输出 TXT 根目录
MAX_LENGTH = 2000   # 每个输出段落的最大字符数，设大可生成较少长段
ANTIWORD_CMD = "antiword"  # antiword 可执行文件名或路径
# =====================


def extract_text(file_path: str) -> str:
    """
    提取 .docx 或 .doc 文本；按段落双换行分隔。
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.docx':
        doc = Document(file_path)
        paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paras)
    elif ext == '.doc':
        try:
            raw = subprocess.check_output([ANTIWORD_CMD, '-m', 'UTF-8.txt', file_path], stderr=subprocess.DEVNULL)
            text = raw.decode('utf-8', errors='ignore')
        except Exception:
            try:
                import pythoncom
                import win32com.client
                word = win32com.client.DispatchEx('Word.Application')
                doc = word.Documents.Open(os.path.abspath(file_path), ReadOnly=True)
                text = doc.Content.Text
                doc.Close(False)
                word.Quit()
            except Exception as e:
                raise RuntimeError(f"无法提取 .doc 文档，请安装 antiword 或 pywin32: {e}")
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        return "\n\n".join(lines)
    else:
        raise ValueError(f"Unsupported file type: {file_path}")


def merge_paragraphs(text: str) -> str:
    """
    合并所有段落，去除多余空行，得到一整段大文本。
    """
    # 将多重空行转为两个换行
    text = re.sub(r"(\n\s*){2,}", "\n\n", text)
    # 如果需要，可以进一步清理
    return text.strip()


def chunk_by_length(text: str, max_len: int = MAX_LENGTH) -> list:
    """
    按固定长度切分文本，生成几个长段落，便于大模型检索。
    """
    chunks = []
    for i in range(0, len(text), max_len):
        chunk = text[i:i+max_len].strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def process_directory():
    """
    递归遍历 INPUT_DIR，将每个 Word 文档提取、合并并切分为若干长段落，输出单个 TXT。
    """
    for root, dirs, files in os.walk(INPUT_DIR):
        rel = os.path.relpath(root, INPUT_DIR)
        out_dir = os.path.join(OUTPUT_DIR, rel)
        os.makedirs(out_dir, exist_ok=True)

        for fn in files:
            if not fn.lower().endswith(('.docx', '.doc')):
                continue
            path_in = os.path.join(root, fn)
            print(f"Processing {path_in}...")
            try:
                raw = extract_text(path_in)
            except Exception as e:
                print(f"Failed to extract {path_in}: {e}")
                continue

            merged = merge_paragraphs(raw)
            parts = chunk_by_length(merged)
            content = "\n\n".join(parts)

            base = os.path.splitext(fn)[0]
            out_file = os.path.join(out_dir, f"{base}.txt")
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(content)
    print("All documents processed.")


if __name__ == '__main__':
    process_directory()