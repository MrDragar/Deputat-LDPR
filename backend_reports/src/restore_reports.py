import os
import json
import uuid
import sqlite3
from src.pdf_creater import generate_pdf_report


DB_PATH = "reports_db.sqlite3"
MEDIA_DIR = "media"
BASE_URL = "https://депутатлдпр.рф/api/reports/media/"


def restore():
    if not os.path.exists(MEDIA_DIR):
        os.makedirs(MEDIA_DIR)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Выбираем записи, где нет ссылки
    cursor.execute("SELECT id, data FROM records WHERE report_link IS NULL")
    rows = cursor.fetchall()

    print(f"Найдено записей для восстановления: {len(rows)}")

    for row in rows:
        record_id = row['id']
        try:
            data = json.loads(row['data'])

            # Генерируем новое имя файла
            report_filename = f"report_{uuid.uuid4()}.pdf"
            report_filepath = os.path.join(MEDIA_DIR, report_filename)

            # Генерируем PDF
            print(f"Генерация отчета для ID {record_id}...")
            generate_pdf_report(data, report_filepath)

            new_link = f"{BASE_URL}{report_filename}"
            conn.execute("UPDATE records SET report_link = ? WHERE id = ?", (new_link, record_id))
            conn.commit()

            print(f"Успешно восстановлено: ID {record_id} -> {report_filename}")

        except Exception as e:
            print(f"Ошибка при восстановлении ID {record_id}: {e}")

    conn.close()
    print("Восстановление завершено.")


if __name__ == "__main__":
    restore()
