from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import shutil
import os
import uuid
import base64

from models import get_db, User, Image, DetectionResult
from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from detection import process_image
from chat import ask_gemini

router = APIRouter(prefix="/api", tags=["apis"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/auth/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/auth/signup")
async def signup(
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(password)
    new_user = User(email=email, hashed_password=hashed_password, full_name=full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}


@router.get("/auth/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
    }


@router.post("/detect")
async def detect_objects(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    annotated_b64, detections = process_image(file_path)

    db_image = Image(filename=filename, filepath=file_path, owner_id=current_user.id)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    for d in detections:
        db_detection = DetectionResult(
            image_id=db_image.id,
            class_name=d["class_name"],
            confidence=d["confidence"],
            bbox=d["bbox"],
        )
        db.add(db_detection)
    db.commit()

    return {
        "image_id": db_image.id,
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}",
        "detections": detections,
    }


@router.post("/chat")
async def chat_about_image(
    question: str = Form(...),
    image_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image = (
        db.query(Image)
        .filter(Image.id == image_id, Image.owner_id == current_user.id)
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    detections = []
    for d in image.detections:
        detections.append(
            {"class_name": d.class_name, "confidence": d.confidence, "bbox": d.bbox}
        )

    with open(image.filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    response = ask_gemini(question, detections, image_b64)
    return {"response": response}
