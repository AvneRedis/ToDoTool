from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Folder as FolderModel
from ..schemas import Folder, FolderCreate, FolderUpdate

router = APIRouter()

@router.get("/", response_model=List[Folder])
def get_folders(db: Session = Depends(get_db)):
    """Get all folders with their hierarchical structure"""
    folders = db.query(FolderModel).filter(FolderModel.parent_id.is_(None)).all()
    return folders

@router.get("/{folder_id}", response_model=Folder)
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    """Get a specific folder by ID"""
    folder = db.query(FolderModel).filter(FolderModel.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@router.post("/", response_model=Folder, status_code=status.HTTP_201_CREATED)
def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    """Create a new folder"""
    # Check if parent exists if parent_id is provided
    if folder.parent_id:
        parent = db.query(FolderModel).filter(FolderModel.id == folder.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    
    db_folder = FolderModel(**folder.dict())
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.put("/{folder_id}", response_model=Folder)
def update_folder(folder_id: int, folder_update: FolderUpdate, db: Session = Depends(get_db)):
    """Update a folder"""
    db_folder = db.query(FolderModel).filter(FolderModel.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Check if parent exists if parent_id is being updated
    if folder_update.parent_id:
        parent = db.query(FolderModel).filter(FolderModel.id == folder_update.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    
    update_data = folder_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_folder, field, value)
    
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    """Delete a folder"""
    db_folder = db.query(FolderModel).filter(FolderModel.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    db.delete(db_folder)
    db.commit()
    return None
