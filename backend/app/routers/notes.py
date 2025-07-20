from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Note as NoteModel, Folder as FolderModel
from ..schemas import Note, NoteCreate, NoteUpdate

router = APIRouter()

@router.get("/", response_model=List[Note])
def get_notes(folder_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all notes, optionally filtered by folder"""
    query = db.query(NoteModel)
    if folder_id is not None:
        query = query.filter(NoteModel.folder_id == folder_id)
    notes = query.order_by(NoteModel.updated_at.desc()).all()
    return notes

@router.get("/{note_id}", response_model=Note)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a specific note by ID"""
    note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED)
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    """Create a new note"""
    # Check if folder exists if folder_id is provided
    if note.folder_id:
        folder = db.query(FolderModel).filter(FolderModel.id == note.folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    
    db_note = NoteModel(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.put("/{note_id}", response_model=Note)
def update_note(note_id: int, note_update: NoteUpdate, db: Session = Depends(get_db)):
    """Update a note"""
    db_note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if folder exists if folder_id is being updated
    if note_update.folder_id:
        folder = db.query(FolderModel).filter(FolderModel.id == note_update.folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    
    update_data = note_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)
    
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note"""
    db_note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(db_note)
    db.commit()
    return None
