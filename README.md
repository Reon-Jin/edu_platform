# edu_platform
This is an AI-driven EDU platform designed for both teachers and students, allowing up-to-date AI-powered course designing and learning experience.

## Installation and Environment
The project requires both a Python and Node.js environment.

### Backend requirements
- Python 3.10 or newer
- `pip` for installing `backend/requirements.txt`

### Frontend requirements
- Node.js 22.13.0
- npm 10.9.2

## Installation

### Backend setup
1. Create and activate a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install Python dependencies
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Configure environment variables by creating `backend/.env`.
   The file should define at least:
   ```ini
   MYSQL_URI=<your database uri>
   DEEPSEEK_API_KEY=<api key>
   DEEPSEEK_ENDPOINT=<api endpoint>
   ```
4. Start the API server
   ```bash
   uvicorn backend.main:app --reload
   ```

### Frontend setup
1. Install packages
   ```bash
   cd frontend
   npm install
   ```
2. Start the dev server
   ```bash
   npm run dev
   ```

