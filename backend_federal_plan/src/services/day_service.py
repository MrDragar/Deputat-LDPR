from typing import List, Optional
import datetime

from src.domain.entities.day import Day, Event
from src.domain.interfaces import IDayRepository, IUnitOfWork


class DayService:
    __uow: IUnitOfWork

    def __init__(self, day_repository: IDayRepository, uow: IUnitOfWork):
        self.day_repository = day_repository
        self.__uow = uow

    async def create_day(self, day: Day) -> Day:
        async with self.__uow.atomic():
            existing_day = await self.day_repository.get_by_date(day.date)
            if existing_day:
                raise ValueError(f"Day with date {day.date} already exists")
            return await self.day_repository.create(day)

    async def get_day(self, day_id: int) -> Optional[Day]:
        async with self.__uow.atomic():
            return await self.day_repository.get_by_id(day_id)

    async def get_day_by_date(self, date: datetime.date) -> Optional[Day]:
        async with self.__uow.atomic():
            return await self.day_repository.get_by_date(date)

    async def list_days(self, skip: int = 0, limit: int = 100) -> List[Day]:
        async with self.__uow.atomic():
            return await self.day_repository.list(skip, limit)

    async def update_day(self, day_id: int, day: Day) -> Optional[Day]:
        async with self.__uow.atomic():
            return await self.day_repository.update(day_id, day)

    async def delete_day(self, day_id: int) -> bool:
        async with self.__uow.atomic():
            return await self.day_repository.delete(day_id)

