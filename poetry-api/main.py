import os
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Poetry Platform API")

# Enable CORS for frontend communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-poetry-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer(auto_error=False)

# Password Utilities
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except jwt.PyJWTError:
        return None
    
    return db.query(models.User).filter(models.User.id == int(user_id)).first()

def require_user(user: Optional[models.User] = Depends(get_current_user)) -> models.User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user

# --- AUTH ROUTES ---
@app.post("/auth/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = create_access_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer", "user": db_user}

@app.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.username == login_data.username_or_email) | 
        (models.User.email == login_data.username_or_email)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username/email or password")
    
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(user: models.User = Depends(require_user)):
    return user

# --- POEM ROUTES ---
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

@app.post("/poems/{poem_id}/view", response_model=schemas.PoemResponse)
def increment_view_count(poem_id: int, db: Session = Depends(get_db)):
    poem = db.query(models.Poem).filter(models.Poem.id == poem_id).first()
    if not poem:
        raise HTTPException(status_code=404, detail="Poem not found")
    
    poem.views_count += 1
    db.commit()
    db.refresh(poem)
    return poem

@app.post("/poems/{poem_id}/like", response_model=schemas.PoemResponse)
def like_poem(poem_id: int, db: Session = Depends(get_db)):
    poem = db.query(models.Poem).filter(models.Poem.id == poem_id).first()
    if not poem:
        raise HTTPException(status_code=404, detail="Poem not found")
    
    poem.likes_count += 1
    db.commit()
    db.refresh(poem)
    return poem

@app.post("/poems", response_model=schemas.PoemResponse, status_code=status.HTTP_201_CREATED)
def create_poem(
    poem: schemas.PoemCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    slug = re.sub(r'[^\w\s-]', '', poem.title.lower()).replace(' ', '-')
    
    db_poem = models.Poem(
        title=poem.title,
        slug=slug,
        content=poem.content,
        excerpt=poem.excerpt,
        status=poem.status,
        mood=poem.mood,
        tags=poem.tags,
        author_id=current_user.id if current_user else None
    )
    db.add(db_poem)
    db.commit()
    db.refresh(db_poem)
    return db_poem

# --- UPDATE POEM ---
@app.put("/poems/{poem_id}", response_model=schemas.PoemResponse)
def update_poem(
    poem_id: int,
    poem_in: schemas.PoemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_user)
):
    db_poem = db.query(models.Poem).filter(models.Poem.id == poem_id).first()
    if not db_poem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poem not found")
    
    if db_poem.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this poem")

    db_poem.title = poem_in.title
    db_poem.content = poem_in.content
    db_poem.excerpt = poem_in.excerpt
    db_poem.status = poem_in.status
    db_poem.mood = poem_in.mood
    db_poem.tags = poem_in.tags

    db.commit()
    db.refresh(db_poem)
    return db_poem


# --- DELETE POEM ---
@app.delete("/poems/{poem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poem(
    poem_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_user)
):
    db_poem = db.query(models.Poem).filter(models.Poem.id == poem_id).first()
    if not db_poem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poem not found")

    if db_poem.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this poem")

    db.delete(db_poem)
    db.commit()
    return None