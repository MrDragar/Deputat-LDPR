from sqlalchemy.orm import Session

from src.models import User


def create_user(db: Session, user_id: int, status: bool = False) -> User:
    user = User(id=user_id, status=status)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def check_user_is_available(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    return user.status
