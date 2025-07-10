# edu_platform
This is an AI-driven EDU platform designed for both teachers and students, allowing up-to-date AI-powered course designing and learning experience.

## Installation and Environment
Conda
Python=3.10.x
node=22.13.0
npm=10.9.2

## launch backend fastapi
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

## launch frontend
```bash
npm run dev
```

## Prepare knowledge base

Build the lesson knowledge base and RAG index:

```bash
python backend/scripts/prepare_knowledge.py
```
