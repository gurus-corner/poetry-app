import re
from typing import List
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import engine, get_db
import re

from database import engine, Base, get_db
import models
import schemas

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Poetry Platform API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)


@app.get("/")
def root():
    return {"message": "Welcome to the Poetry Platform API"}

@app.get("/poems", response_model=List[schemas.PoemResponse])
def get_poems(
    mood: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Poem)
    
    if mood and mood.lower() != "all":
        query = query.filter(models.Poem.mood.ilike(f"%{mood}%"))
        
    if tag:
        query = query.filter(models.Poem.tags.ilike(f"%{tag}%"))
        
    return query.order_by(models.Poem.created_at.desc()).all()


@app.post("/poems", response_model=schemas.PoemResponse, status_code=status.HTTP_201_CREATED)
def create_poem(poem: schemas.PoemCreate, db: Session = Depends(get_db)):
    slug = re.sub(r'[^\w\s-]', '', poem.title.lower()).replace(' ', '-')
    
    db_poem = models.Poem(
        title=poem.title,
        slug=slug,
        content=poem.content,
        excerpt=poem.excerpt,
        status=poem.status,
        mood=poem.mood,
        tags=poem.tags
    )
    db.add(db_poem)
    db.commit()
    db.refresh(db_poem)
    return db_poem


@app.get("/poems", response_model=List[schemas.PoemResponse])
def get_poems(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(models.Poem).offset(skip).limit(limit).all()


@app.get("/poems/{poem_id}", response_model=schemas.PoemResponse)
def get_poem(poem_id: UUID, db: Session = Depends(get_db)):
    poem = db.query(models.Poem).filter(models.Poem.id == poem_id).first()
    if not poem:
        raise HTTPException(status_code=404, detail="Poem not found")
    
    # Increment view count
    poem.views_count += 1
    db.commit()
    db.refresh(poem)
    return poem