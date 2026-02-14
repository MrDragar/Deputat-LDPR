from abc import ABC, abstractmethod
from contextlib import _AsyncGeneratorContextManager
from datetime import datetime
from typing import Optional, List

from .entities import User, Day, Event


class IUnitOfWork(ABC):
    @abstractmethod
    def atomic(self) -> _AsyncGeneratorContextManager[None, None]:
        ...


class IDayRepository(ABC):
    @abstractmethod
    async def create(self, day: Day) -> Day:
        pass

    @abstractmethod
    async def get_by_id(self, day_id: int) -> Optional[Day]:
        pass

    @abstractmethod
    async def get_by_date(self, date: datetime.date) -> Optional[Day]:
        pass

    @abstractmethod
    async def list(self, skip: int = 0, limit: int = 100) -> List[Day]:
        pass

    @abstractmethod
    async def update(self, day_id: int, day: Day) -> Optional[Day]:
        pass

    @abstractmethod
    async def delete(self, day_id: int) -> bool:
        pass


class IJWTRepository:
    async def decode_access_token(self, token: str) -> User:
        ...
