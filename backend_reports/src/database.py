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

    def get_all(self) -> list:
        """Получить все записи без колонки data"""
        query = "SELECT id, user_id, report_link, created_at FROM records ORDER BY id DESC"
        cursor = self.conn.execute(query)
        return [
            {"id": row[0], "user_id": row[1], "report_link": row[2], "created_at": row[3]}
            for row in cursor.fetchall()
        ]

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        """Получить детальную запись по ID"""
        query = "SELECT id, user_id, data, report_link, created_at FROM records WHERE id = ?"
        cursor = self.conn.execute(query, (record_id,))
        row = cursor.fetchone()
        if row:
            return {
                "id": row[0], 
                "user_id": row[1], 
                "data": json.loads(row[2]), 
                "report_link": row[3], 
                "created_at": row[4]
            }
        return None

    def update(self, record_id: int, data: Dict[str, Any], report_link: str):
        """Обновить data и ссылку для записи"""
        query = "UPDATE records SET data = ?, report_link = ? WHERE id = ?"
        self.conn.execute(query, (json.dumps(data), report_link, record_id))
        self.conn.commit()

    def delete(self, record_id: int):
        """Удалить запись по ID"""
        query = "DELETE FROM records WHERE id = ?"
        self.conn.execute(query, (record_id,))
        self.conn.commit()
