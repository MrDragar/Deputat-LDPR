import logging
from datetime import timedelta, datetime, UTC
from typing import Optional
from dataclasses import asdict

from jose import jwt

from src.domain.entities import User
from src.domain.exceptions import AuthError
from src.domain.interfaces import IJWTRepository


class JWTRepository(IJWTRepository):
    __public_key: str
    __algorithm: str

    def __init__(self, public_key, algorithm):
        self.__public_key = public_key
        self.__algorithm = algorithm

    async def decode_access_token(self, token: str) -> User:
        payload = jwt.decode(token, self.__public_key, algorithms=[self.__algorithm])
        if int(payload.get('exp')) < datetime.now(UTC).timestamp():
            raise AuthError('Токен истёк')
        if 'user_id' not in payload or 'role' not in payload or 'login' not in payload:
            raise AuthError('Некорректный токен')
        return User(id=payload['user_id'], role=payload['role'], login=payload['login'])
