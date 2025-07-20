from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import notes, folders, todos

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notes & ToDo API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(folders.router, prefix="/api/folders", tags=["folders"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(todos.router, prefix="/api/todos", tags=["todos"])

@app.get("/")
async def root():
    return {"message": "Notes & ToDo API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
