from pydantic import BaseModel


class JWTToken(BaseModel):
    token: str
    
    
class MeResponse(BaseModel):
    id: int
    login: str
    role: str
