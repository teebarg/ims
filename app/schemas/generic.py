from pydantic import BaseModel

class Message(BaseModel):
    details: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
