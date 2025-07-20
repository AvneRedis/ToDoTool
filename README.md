# Notes & To-Do Management Application

A modern web application for managing notes and to-do lists with an organized folder structure.

## Features

- **Notes Management**: Create and organize notes in expandable folders
- **Three-Section Notes**: Each note has General Notes, Discussion Points, and To-Do Items
- **Folder Organization**: Create folders like "1on1s", "Leadership meetings", etc.
- **Two-Tab Interface**: Separate tabs for Notes and To-Do management

## Architecture

- **Backend**: Python FastAPI
- **Frontend**: React with Vite
- **Database**: SQLite with SQLAlchemy

## Project Structure

```
ToDoTool/
├── backend/          # Python FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   └── main.py
├── frontend/         # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Development

The application will run on:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
