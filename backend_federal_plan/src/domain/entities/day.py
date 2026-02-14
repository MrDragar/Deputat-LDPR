from dataclasses import dataclass, field
import datetime


@dataclass
class Holiday:
    id: int
    name: str


@dataclass
class Detail:
    id: int
    name: str
    value: str


@dataclass
class Event:
    id: int
    title: str
    party_image: str
    is_infostrike: bool
    details: list[Detail] = field(default_factory=list)


@dataclass
class Day:
    id: int
    date: datetime.date
    holidays: list[Holiday] = field(default_factory=list)
    events: list[Event] = field(default_factory=list)
