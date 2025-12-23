import json
import sqlite3
from typing import Any, Dict


class Database:
    def __init__(self, db_path: str = "reports_db.sqlite3"):
        self.conn = sqlite3.connect(db_path)
        self.create_table()

    def create_table(self):
        """Создание таблицы если не существует"""
        query = """
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mx-auto BIGINT NOT NULL,
            data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_user_id ON records(user_id);
        CREATE INDEX IF NOT EXISTS idx_created_at ON records(created_at);
        """
        self.conn.executescript(query)
        self.conn.commit()

    def insert(self, user_id: int, data: Dict[str, Any]) -> int:
        """Вставка записи для конкретного пользователя"""
        query = "INSERT INTO records (user_id, data) VALUES (?, ?)"
        cursor = self.conn.execute(query, (user_id, json.dumps(data)))
        self.conn.commit()
        return cursor.lastrowid