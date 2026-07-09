from typing import Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfileSchema(BaseModel):
    current_job_title: Optional[str] = None
    total_experience_months: int = 0
    preferred_industry: Optional[str] = None

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    profile: Optional[UserProfileSchema] = None

    class Config:
        from_attributes = True
