from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Folder schemas
class FolderBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None

class Folder(FolderBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    children: List['Folder'] = []
    
    class Config:
        from_attributes = True

# Note schemas
class NoteBase(BaseModel):
    title: str
    folder_id: Optional[int] = None
    archived: bool = False
    general_notes: Optional[str] = ""
    discussion_points: Optional[str] = ""
    todo_items: Optional[str] = ""

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    folder_id: Optional[int] = None
    archived: Optional[bool] = None
    general_notes: Optional[str] = None
    discussion_points: Optional[str] = None
    todo_items: Optional[str] = None

class Note(NoteBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# TodoItem schemas
class TodoItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: str = "medium"
    due_date: Optional[datetime] = None

class TodoItemCreate(TodoItemBase):
    pass

class TodoItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None

class TodoItem(TodoItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Update forward references
Folder.model_rebuild()
