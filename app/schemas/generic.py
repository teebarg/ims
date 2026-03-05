from pydantic import BaseModel

# Contents of JWT token
class TokenPayload(BaseModel):
    sub: str | None = None

class Message(BaseModel):
    message: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
