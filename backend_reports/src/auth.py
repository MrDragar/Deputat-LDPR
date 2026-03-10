import jwt
import logging
from datetime import datetime, timezone
from fastapi import Header, HTTPException, status, Depends
from pydantic import BaseModel
from src.config import PUBLIC_KEY, ALGORITHM


class User(BaseModel):
    id: int
    role: str
    login: str


class AuthError(Exception):
    pass


async def get_current_admin(
        token: str = Header(..., alias="Authorization")
) -> User:
    if token.startswith("Bearer "):
        token = token[7:]

    try:
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=[ALGORITHM])

        if int(payload.get('exp', 0)) < datetime.now(timezone.utc).timestamp():
            raise AuthError('Токен истёк')

        if 'user_id' not in payload or 'role' not in payload or 'login' not in payload:
            raise AuthError('Некорректный токен')

        user = User(id=payload['user_id'], role=payload['role'], login=payload['login'])

        if user.role != 'admin':
            raise AuthError('Недостаточно прав. Требуется роль admin')

        return user

    except jwt.PyJWTError as e:
        logging.exception(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный или поврежденный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
