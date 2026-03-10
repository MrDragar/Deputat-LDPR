import json
import sqlite3
from typing import Any, Dict, Optional


class Database:
    def __init__(self, db_path: str = "reports_db.sqlite3"):
        self.conn = sqlite3.connect(db_path)
        self.create_table()

    def create_table(self):
        """Создание таблицы если не существует"""
        query = """
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id BIGINT NOT NULL,
            data TEXT NOT NULL,
            report_link TEXT, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_id ON records(user_id);
        CREATE INDEX IF NOT EXISTS idx_created_at ON records(created_at);
        """
        self.conn.executescript(query)
        self.conn.commit()

    def insert(self, user_id: int, data: Dict[str, Any], report_link: Optional[str] = None) -> int:
        """Вставка записи с ссылкой"""
        query = "INSERT INTO records (user_id, data, report_link) VALUES (?, ?, ?)"
        cursor = self.conn.execute(query, (user_id, json.dumps(data), report_link))
        self.conn.commit()
        return cursor.lastrowid

    def update_link(self, record_id: int, report_link: str):
        """Метод для обновления ссылки (понадобится для скрипта восстановления)"""
        query = "UPDATE records SET report_link = ? WHERE id = ?"
        self.conn.execute(query, (report_link, record_id))
        self.conn.commit()
