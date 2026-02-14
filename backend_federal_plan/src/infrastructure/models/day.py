import datetime
from typing import List

from sqlalchemy import ForeignKey, Boolean, String, Date, Text, \
    UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.domain.entities.day import Day, Detail, Holiday, Event
from src.infrastructure.database import Base


class HolidayORM(Base):
    __tablename__ = "holidays"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    day_id: Mapped[int] = mapped_column(ForeignKey("days.id"))

    day: Mapped["DayORM"] = relationship(back_populates="holidays")

    async def to_domain(self) -> Holiday:
        return Holiday(
            id=self.id,
            name=self.name
        )

    @classmethod
    async def from_domain(cls, holiday: "Holiday", day_id: int) -> "HolidayORM":
        return cls(
            id=holiday.id,
            name=holiday.name,
            day_id=day_id
        )


class DetailORM(Base):
    __tablename__ = "details"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))

    event: Mapped["EventORM"] = relationship(back_populates="details")

    async def to_domain(self) -> Detail:
        return Detail(
            id=self.id,
            name=self.name,
            value=self.value
        )

    @classmethod
    async def from_domain(cls, detail: Detail, event_id: int) -> "DetailORM":
        return cls(
            id=detail.id,
            name=detail.name,
            value=detail.value,
            event_id=event_id
        )


class EventORM(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    party_image: Mapped[str] = mapped_column(String(500), nullable=True)
    is_infostrike: Mapped[bool] = mapped_column(Boolean, nullable=False,
                                                default=False)
    day_id: Mapped[int] = mapped_column(ForeignKey("days.id"))
    day: Mapped["DayORM"] = relationship(back_populates="events")
    details: Mapped[List[DetailORM]] = relationship(
        "DetailORM",
        back_populates="event",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    async def to_domain(self) -> Event:
        return Event(
            id=self.id,
            title=self.title,
            party_image=self.party_image,
            is_infostrike=self.is_infostrike,
            details=[await detail.to_domain() for detail in self.details]
        )

    @classmethod
    async def from_domain(cls, event: Event, day_id: int) -> "EventORM":
        return cls(
            id=event.id,
            title=event.title,
            party_image=event.party_image,
            is_infostrike=event.is_infostrike,
            day_id=day_id
        )


class DayORM(Base):
    __tablename__ = "days"
    __table_args__ = (UniqueConstraint('date'),)

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)

    holidays: Mapped[List[HolidayORM]] = relationship(
        "HolidayORM",
        back_populates="day",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    events: Mapped[List[DetailORM]] = relationship(
        "EventORM",
        back_populates="day",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    async def to_domain(self) -> Day:
        return Day(
            id=self.id,
            date=self.date,
            holidays=[await holiday.to_domain() for holiday in self.holidays],
            events=[await event.to_domain() for event in self.events]
        )

    @classmethod
    async def from_domain(cls, day: Day) -> "DayORM":
        return cls(
            id=day.id,
            date=day.date
        )
