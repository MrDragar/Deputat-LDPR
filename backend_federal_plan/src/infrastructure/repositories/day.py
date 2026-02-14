from typing import List, Optional
import datetime
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from src.domain.interfaces import IDayRepository
from src.domain.entities.day import Day, Event
from src.infrastructure.interfaces import IDatabaseUnitOfWork
from src.infrastructure.models.day import DayORM, EventORM, HolidayORM, \
    DetailORM


class DayRepository(IDayRepository):
    __uow: IDatabaseUnitOfWork

    def __init__(self, uow: IDatabaseUnitOfWork):
        self.__uow = uow

    async def create(self, day: Day) -> Day:
        session = self.__uow.get_session()
        day.id = None
        day_orm = await DayORM.from_domain(day)

        day_orm.holidays = []
        day_orm.events = []

        session.add(day_orm)
        await session.flush()
        await session.refresh(day_orm)

        for holiday in day.holidays:
            holiday.id = None
            holiday_orm = await HolidayORM.from_domain(holiday,
                                                       day_id=day_orm.id)
            if not hasattr(holiday_orm,
                           'details') or holiday_orm.details is None:
                holiday_orm.details = []
            day_orm.holidays.append(holiday_orm)

        for event in day.events:
            event.id = None
            event_orm = await EventORM.from_domain(event, day_id=day_orm.id)
            event_orm.details = []
            day_orm.events.append(event_orm)

        session.add_all(day_orm.holidays)
        session.add_all(day_orm.events)
        await session.flush()

        for event, event_orm in zip(day.events, day_orm.events):
            for detail in event.details:
                detail.id = None
                detail_orm = await DetailORM.from_domain(
                    detail, event_id=event_orm.id
                )
                event_orm.details.append(detail_orm)

        for event_orm in day_orm.events:
            session.add_all(event_orm.details)

        await session.flush()

        stmt = (
            select(DayORM)
            .where(DayORM.id == day_orm.id)
            .options(
                selectinload(DayORM.holidays),
                selectinload(DayORM.events).selectinload(EventORM.details)
            )
        )
        result = await session.execute(stmt)
        day_orm_with_relations = result.scalar_one()

        result_domain = await day_orm_with_relations.to_domain()
        return result_domain

    async def get_by_id(self, day_id: int) -> Optional[Day]:
        session = self.__uow.get_session()
        query = (
            select(DayORM)
            .where(DayORM.id == day_id)
        )
        result = await session.execute(query)
        day_orm = result.scalar_one_or_none()

        if day_orm:
            return await day_orm.to_domain()
        return None

    async def get_by_date(self, date: datetime.date) -> Optional[Day]:
        session = self.__uow.get_session()
        query = (
            select(DayORM)
            .where(DayORM.date == date)
        )
        result = await session.execute(query)
        day_orm = result.scalar_one_or_none()

        if day_orm:
            return await day_orm.to_domain()
        return None

    async def list(self, skip: int = 0, limit: int = 100) -> List[Day]:
        session = self.__uow.get_session()
        query = (
            select(DayORM)
            .offset(skip)
            .limit(limit)
            .order_by(DayORM.date)
        )
        result = await session.execute(query)
        days_orm = result.scalars().all()

        return [await day_orm.to_domain() for day_orm in days_orm]

    async def update(self, day_id: int, day: Day) -> Optional[Day]:
        session = self.__uow.get_session()

        # Загружаем day_orm СО ВСЕМИ СВЯЗЯМИ сразу
        query = (
            select(DayORM)
            .where(DayORM.id == day_id)
            .options(
                selectinload(DayORM.holidays),
                selectinload(DayORM.events).selectinload(EventORM.details)
            )
        )
        result = await session.execute(query)
        day_orm = result.scalar_one_or_none()

        if not day_orm:
            return None

        day_orm.date = day.date

        # Очищаем holidays (они уже загружены благодаря options)
        day_orm.holidays.clear()
        for holiday in day.holidays:
            holiday.id = None
            holiday_orm = await HolidayORM.from_domain(
                holiday,
                day_id=day_orm.id
            )
            day_orm.holidays.append(holiday_orm)

        # Очищаем events
        day_orm.events.clear()

        # Создаем новые events
        for event in day.events:
            event.id = None
            event_orm = await EventORM.from_domain(event, day_id=day_orm.id)

            # ВАЖНО: Инициализируем пустую коллекцию details
            event_orm.details = []

            for detail in event.details:
                detail.id = None
                detail_orm = await DetailORM.from_domain(detail,
                                                         event_id=event_orm.id)
                event_orm.details.append(detail_orm)

            day_orm.events.append(event_orm)

        # Добавляем все новые объекты в сессию
        session.add_all(day_orm.holidays)
        for event_orm in day_orm.events:
            session.add_all(event_orm.details)
        session.add_all(day_orm.events)

        await session.flush()

        # Перезагружаем со всеми связями для to_domain
        stmt = (
            select(DayORM)
            .where(DayORM.id == day_orm.id)
            .options(
                selectinload(DayORM.holidays),
                selectinload(DayORM.events).selectinload(EventORM.details)
            )
        )
        result = await session.execute(stmt)
        day_orm_with_relations = result.scalar_one()

        result_domain = await day_orm_with_relations.to_domain()
        return result_domain

    async def delete(self, day_id: int) -> bool:
        session = self.__uow.get_session()
        day_orm = await session.get(DayORM, day_id)
        if not day_orm:
            return False
        await session.delete(day_orm)
        await session.commit()
        return True

