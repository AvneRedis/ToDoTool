from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import TodoItem as TodoItemModel
from ..schemas import TodoItem, TodoItemCreate, TodoItemUpdate

router = APIRouter()

@router.get("/", response_model=List[TodoItem])
def get_todos(completed: Optional[bool] = None, db: Session = Depends(get_db)):
    """Get all todo items, optionally filtered by completion status"""
    query = db.query(TodoItemModel)
    if completed is not None:
        query = query.filter(TodoItemModel.completed == completed)
    todos = query.order_by(TodoItemModel.created_at.desc()).all()
    return todos

@router.get("/{todo_id}", response_model=TodoItem)
def get_todo(todo_id: int, db: Session = Depends(get_db)):
    """Get a specific todo item by ID"""
    todo = db.query(TodoItemModel).filter(TodoItemModel.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo item not found")
    return todo

@router.post("/", response_model=TodoItem, status_code=status.HTTP_201_CREATED)
def create_todo(todo: TodoItemCreate, db: Session = Depends(get_db)):
    """Create a new todo item"""
    db_todo = TodoItemModel(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.put("/{todo_id}", response_model=TodoItem)
def update_todo(todo_id: int, todo_update: TodoItemUpdate, db: Session = Depends(get_db)):
    """Update a todo item"""
    db_todo = db.query(TodoItemModel).filter(TodoItemModel.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    update_data = todo_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_todo, field, value)
    
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    """Delete a todo item"""
    db_todo = db.query(TodoItemModel).filter(TodoItemModel.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    db.delete(db_todo)
    db.commit()
    return None

@router.patch("/{todo_id}/toggle", response_model=TodoItem)
def toggle_todo_completion(todo_id: int, db: Session = Depends(get_db)):
    """Toggle the completion status of a todo item"""
    db_todo = db.query(TodoItemModel).filter(TodoItemModel.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    db_todo.completed = not db_todo.completed
    db.commit()
    db.refresh(db_todo)
    return db_todo
