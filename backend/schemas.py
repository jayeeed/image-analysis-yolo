from pydantic import BaseModel

class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str

class ChatRequest(BaseModel):
    question: str
    image_id: int
