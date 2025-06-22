# edu_platform
This is an AI-driven EDU platform designed for both teachers and students, allowing up-to-date AI-powered course designing and learning experience.

## Installation and Environment
Conda
Python=3.10.x
node=22.13.0
npm=10.9.2

## launch backend fastapi
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

## launch frontend
```bash
npm run dev
```

## Knowledge base

Place your `.txt`, `.docx`, `.doc` or `.pdf` files under `backend/knowledge`.
Files are automatically scanned when generating lessons. Texts are split by
paragraphs and bullet points, and duplicate segments are removed.
