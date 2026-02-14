from abc import ABC, abstractmethod

from src.domain.entities.user import User


class IAuthService(ABC):
    @abstractmethod
    async def get_user(self, jwt_token: str) -> User:
        ...
