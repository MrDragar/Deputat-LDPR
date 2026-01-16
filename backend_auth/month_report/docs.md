# Обновленная документация API для системы отчётности депутатов

## Base URL: `/api/auth/mouth_reports/`

## Важное обновление:
**API теперь использует разные форматы ответов для списков и детальных запросов:**

- **GET списка объектов** - возвращает простые объекты
- **GET конкретного объекта** - возвращает объект с вложенными связанными данными

---

## 1. Отчётные периоды (Report Periods)

### Получить список всех периодов (без вложенных объектов)
```http
GET /api/auth/mouth_reports/report-periods/
```

**Ответ (список):**
```json
[
  {
    "id": 1,
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
]
```

### Получить конкретный период (со вложенными объектами)
```http
GET /api/auth/mouth_reports/report-periods/{id}/
```

**Ответ (детальный):**
```json
{
  "id": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "reports": [
    {
      "id": 1,
      "reportPeriod": 1,
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "name": "Инфоудар за январь",
      "description": "Описание отчёта",
      "theme": "infoudar",
      "themeDisplay": "Инфоудар"
    }
  ],
  "regionReports": [
    {
      "id": 1,
      "regionName": "Московская область",
      "reportPeriod": 1
    }
  ]
}
```

### Создать новый период
```http
POST /api/auth/mouth_reports/report-periods/
```

**Тело запроса:**
```json
{
  "startDate": "2024-02-01",
  "endDate": "2024-02-29"
}
```

### Обновить период
```http
PUT /api/auth/mouth_reports/report-periods/{id}/
```

### Частичное обновление
```http
PATCH /api/auth/mouth_reports/report-periods/{id}/
```

### Удалить период
```http
DELETE /api/auth/mouth_reports/report-periods/{id}/
```

---

## 2. Отчёты (Reports)

### Получить список всех отчётов
```http
GET /api/auth/mouth_reports/reports/
```

**Ответ (список):**
```json
[
  {
    "id": 1,
    "reportPeriod": 1,
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "name": "Отчёт за январь",
    "description": "Описание отчёта",
    "theme": "infoudar",
    "themeDisplay": "Инфоудар"
  }
]
```

### Получить конкретный отчёт
```http
GET /api/auth/mouth_reports/reports/{id}/
```

**Ответ (детальный):**
```json
{
  "id": 1,
  "reportPeriod": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "name": "Отчёт за январь",
  "description": "Описание отчёта",
  "theme": "infoudar",
  "themeDisplay": "Инфоудар"
}
```

### Создать новый отчёт
```http
POST /api/auth/mouth_reports/reports/
```

**Тело запроса:**
```json
{
  "reportPeriod": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "name": "Отчёт за январь",
  "description": "Описание отчёта",
  "theme": "vdpg"
}
```

**Допустимые значения для `theme`:**
- `"infoudar"` - Инфоудар
- `"vdpg"` - ВДПГ
- `"event"` - Мероприятие
- `"reg_event"` - Мероприятие в рег. парламенте
- `"opt_event"` - Опциональное мероприятие
- `"letter"` - Письмо

---

## 3. Региональные отчёты (Region Reports)

### Получить список всех региональных отчётов
```http
GET /api/auth/mouth_reports/region-reports/
```

**Ответ (список):**
```json
[
  {
    "id": 1,
    "regionName": "Московская область",
    "reportPeriod": 1
  }
]
```

### Получить конкретный региональный отчёт (со вложенными записями депутатов)
```http
GET /api/auth/mouth_reports/region-reports/{id}/
```

**Ответ (детальный):**
```json
{
  "id": 1,
  "regionName": "Московская область",
  "reportPeriod": 1,
  "deputiesRecords": [
    {
      "id": 1,
      "deputy": 1,
      "regionReport": 1,
      "fio": "Иванов Иван Иванович",
      "isAvailable": true,
      "level": "MCU",
      "levelDisplay": "Депутаты муниципальных образований",
      "reason": null
    }
  ]
}
```

### Создать новый региональный отчёт
```http
POST /api/auth/mouth_reports/region-reports/
```

**Тело запроса:**
```json
{
  "regionName": "Московская область",
  "reportPeriod": 1
}
```

---

## 4. Записи депутатов (Deputy Records)

### Получить список всех записей депутатов
```http
GET /api/auth/mouth_reports/deputy-records/
```

**Ответ (список):**
```json
[
  {
    "id": 1,
    "deputy": 1,
    "regionReport": 1,
    "fio": "Иванов Иван Иванович",
    "isAvailable": true,
    "level": "MCU",
    "levelDisplay": "Депутаты муниципальных образований",
    "reason": null
  }
]
```

### Получить конкретную запись депутата (со вложенными отчётными записями)
```http
GET /api/auth/mouth_reports/deputy-records/{id}/
```

**Ответ (детальный):**
```json
{
  "id": 1,
  "deputy": 1,
  "regionReport": 1,
  "fio": "Иванов Иван Иванович",
  "isAvailable": true,
  "level": "MCU",
  "levelDisplay": "Депутаты муниципальных образований",
  "reason": null,
  "reportRecords": [
    {
      "id": 1,
      "report": 1,
      "deputyRecord": 1,
      "link": "https://example.com/report/1"
    }
  ]
}
```

### Создать новую запись депутата
```http
POST /api/auth/mouth_reports/deputy-records/
```

**Тело запроса:**
```json
{
  "deputy": 1,
  "regionReport": 1,
  "fio": "Иванов Иван Иванович",
  "isAvailable": true,
  "level": "MCU",
  "reason": "Причина неактивности (если isAvailable=false)"
}
```

**Допустимые значения для `level`:**
- `"MCU"` - Депутаты муниципальных образований
- `"ACR"` - Депутаты административных центров регионов
- `"ZS"` - Депутаты Законодательных собраний регионов

---

## 5. Отчётные записи (Report Records)

### Получить список всех отчётных записей
```http
GET /api/auth/mouth_reports/report-records/
```

**Ответ (список):**
```json
[
  {
    "id": 1,
    "report": 1,
    "deputyRecord": 1,
    "link": "https://example.com/report/1"
  }
]
```

### Получить конкретную отчётную запись
```http
GET /api/auth/mouth_reports/report-records/{id}/
```

**Ответ (детальный):**
```json
{
  "id": 1,
  "report": 1,
  "deputyRecord": 1,
  "link": "https://example.com/report/1"
}
```

### Создать новую отчётную запись
```http
POST /api/auth/mouth_reports/report-records/
```

**Тело запроса:**
```json
{
  "report": 1,
  "deputyRecord": 1,
  "link": "https://example.com/report/1"
}
```

---

## Пример создания полной цепочки данных

### 1. Создать отчётный период:
```http
POST /api/auth/mouth_reports/report-periods/
```
```json
{
  "startDate": "2024-03-01",
  "endDate": "2024-03-31"
}
```

### 2. Создать отчёт:
```http
POST /api/auth/mouth_reports/reports/
```
```json
{
  "reportPeriod": 1,
  "name": "Мартовский отчёт",
  "description": "Ежемесячный отчёт за март",
  "theme": "event"
}
```

### 3. Создать региональный отчёт:
```http
POST /api/auth/mouth_reports/region-reports/
```
```json
{
  "regionName": "Ленинградская область",
  "reportPeriod": 1
}
```

### 4. Создать запись депутата:
```http
POST /api/auth/mouth_reports/deputy-records/
```
```json
{
  "regionReport": 1,
  "fio": "Петров Петр Петрович",
  "isAvailable": true,
  "level": "ZS"
}
```

### 5. Создать отчётную запись:
```http
POST /api/auth/mouth_reports/report-records/
```
```json
{
  "report": 1,
  "deputyRecord": 1,
  "link": "https://example.com/petrov-report"
}
```

---

## Структура связанных данных при GET запросах:

### Получить полную информацию об отчётном периоде:
```http
GET /api/auth/mouth_reports/report-periods/1/
```
→ Возвращает период со всеми отчётами и региональными отчётами

### Получить информацию о региональном отчёте:
```http
GET /api/auth/mouth_reports/region-reports/1/
```
→ Возвращает региональный отчёт со всеми записями депутатов

### Получить информацию о депутате:
```http
GET /api/auth/mouth_reports/deputy-records/1/
```
→ Возвращает запись депутата со всеми его отчётными записями

---

## Коды ответов
- `200` - Успешный запрос
- `201` - Успешное создание
- `400` - Неверные данные
- `401` - Не авторизован
- `403` - Нет доступа
- `404` - Ресурс не найден
- `500` - Ошибка сервера
