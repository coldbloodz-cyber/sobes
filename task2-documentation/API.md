# API Documentation

## Обзор

Task Management API предоставляет RESTful интерфейс для управления задачами. API следует стандартам REST и возвращает данные в формате JSON.

### Базовый URL
```
http://localhost:3000
```

### Заголовки
Все запросы должны включать:
```
Content-Type: application/json
Accept: application/json
```

### Коды ответов

| Код | Описание | Использование |
|-----|----------|---------------|
| 200 | OK | Успешный запрос |
| 201 | Created | Ресурс успешно создан |
| 204 | No Content | Успешно, тело ответа отсутствует |
| 400 | Bad Request | Неверные параметры запроса |
| 404 | Not Found | Ресурс не найден |
| 500 | Internal Server Error | Внутренняя ошибка сервера |

## Endpoints

### Health Check

Проверка состояния сервера.

#### `GET /health`

**Описание**: Возвращает информацию о состоянии сервера

**Параметры**: Нет

**Пример запроса**:
```bash
curl -X GET http://localhost:3000/health
```

**Пример ответа**:
```json
{
  "status": "OK",
  "timestamp": "2024-12-19T16:17:23.456Z",
  "uptime": 3661.234,
  "memory": {
    "rss": 12345678,
    "heapTotal": 23456789,
    "heapUsed": 1234567,
    "external": 123456
  }
}
```

---

### Управление задачами

#### `GET /tasks`

**Описание**: Получение списка задач с возможностью фильтрации, поиска и пагинации

**Параметры запроса**:

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| `page` | integer | Номер страницы | 1 |
| `limit` | integer | Количество задач на странице | 10 |
| `completed` | boolean | Фильтр по статусу выполнения | - |
| `priority` | string | Фильтр по приоритету (low/medium/high) | - |
| `search` | string | Поиск по названию и описанию | - |
| `sortBy` | string | Поле для сортировки | createdAt |
| `sortOrder` | string | Порядок сортировки (asc/desc) | desc |

**Пример запроса**:
```bash
# Получить все задачи
curl "http://localhost:3000/tasks"

# С пагинацией
curl "http://localhost:3000/tasks?page=2&limit=5"

# С фильтрацией
curl "http://localhost:3000/tasks?completed=false&priority=high"

# С поиском
curl "http://localhost:3000/tasks?search=важная%20задача"

# С сортировкой
curl "http://localhost:3000/tasks?sortBy=priority&sortOrder=asc"
```

**Пример ответа**:
```json
{
  "tasks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Важная задача",
      "description": "Описание важной задачи",
      "completed": false,
      "priority": "high",
      "createdAt": "2024-12-19T16:00:00.000Z",
      "updatedAt": "2024-12-19T16:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### `GET /tasks/:id`

**Описание**: Получение конкретной задачи по ID

**Параметры**:
- `id` (path) - UUID задачи

**Пример запроса**:
```bash
curl "http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000"
```

**Пример ответа**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Важная задача",
  "description": "Подробное описание важной задачи",
  "completed": false,
  "priority": "high",
  "createdAt": "2024-12-19T16:00:00.000Z",
  "updatedAt": "2024-12-19T16:00:00.000Z"
}
```

**Возможные ошибки**:
```json
{
  "error": "Task not found"
}
```

#### `POST /tasks`

**Описание**: Создание новой задачи

**Тело запроса**:
```json
{
  "title": "string (обязательно, до 200 символов)",
  "description": "string (опционально, до 1000 символов)",
  "priority": "low|medium|high (опционально, по умолчанию medium)",
  "completed": "boolean (опционально, по умолчанию false)"
}
```

**Пример запроса**:
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новая задача",
    "description": "Описание новой задачи",
    "priority": "medium"
  }'
```

**Пример ответа**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Новая задача",
  "description": "Описание новой задачи",
  "completed": false,
  "priority": "medium",
  "createdAt": "2024-12-19T16:15:00.000Z",
  "updatedAt": "2024-12-19T16:15:00.000Z"
}
```

**Возможные ошибки**:
```json
{
  "error": "Validation failed",
  "details": [
    "Title is required and must be a non-empty string",
    "Title must be less than 200 characters"
  ]
}
```

#### `PUT /tasks/:id`

**Описание**: Обновление существующей задачи

**Параметры**:
- `id` (path) - UUID задачи

**Тело запроса**:
```json
{
  "title": "string (опционально)",
  "description": "string (опционально)",
  "priority": "low|medium|high (опционально)",
  "completed": "boolean (опционально)"
}
```

**Пример запроса**:
```bash
curl -X PUT http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "priority": "low"
  }'
```

**Пример ответа**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Важная задача",
  "description": "Описание важной задачи",
  "completed": true,
  "priority": "low",
  "createdAt": "2024-12-19T16:00:00.000Z",
  "updatedAt": "2024-12-19T16:20:00.000Z"
}
```

#### `DELETE /tasks/:id`

**Описание**: Удаление конкретной задачи

**Параметры**:
- `id` (path) - UUID задачи

**Пример запроса**:
```bash
curl -X DELETE http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000
```

Ответ: 204 No Content

#### `DELETE /tasks`

**Описание**: Удаление всех задач (очистка)

**Пример запроса**:
```bash
curl -X DELETE http://localhost:3000/tasks
```

Ответ: 204 No Content

## Схемы данных

### Task (Задача)

```typescript
interface Task {
  id: string;          // UUID v4
  title: string;       // 1-200 символов
  description?: string; // 0-1000 символов
  completed: boolean;  // По умолчанию false
  priority: 'low' | 'medium' | 'high'; // По умолчанию medium
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### Pagination Response

```typescript
interface PaginationResponse<T> {
  [dataKey]: T[];      // Массив данных
  pagination: {
    page: number;      // Текущая страница
    limit: number;     // Элементов на странице
    total: number;     // Общее количество элементов
    totalPages: number; // Общее количество страниц
  };
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: string;       // Сообщение об ошибке
  details?: string[];  // Детали ошибки (для валидации)
  code?: string;       // Код ошибки
}
```

## Примеры использования

### Типичный workflow

```bash
# 1. Создать задачу
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Изучить API", "priority": "high"}'

# 2. Получить список задач
curl "http://localhost:3000/tasks"

# 3. Обновить задачу
curl -X PUT http://localhost:3000/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# 4. Удалить задачу
curl -X DELETE http://localhost:3000/tasks/{id}
```

### Работа с фильтрами

```bash
# Найти все невыполненные задачи высокого приоритета
curl "http://localhost:3000/tasks?completed=false&priority=high"

# Поиск задач по тексту
curl "http://localhost:3000/tasks?search=проект"

# Получить вторую страницу с 5 задачами на странице
curl "http://localhost:3000/tasks?page=2&limit=5"
```

### Сортировка

```bash
# Сортировка по дате создания (новые сначала)
curl "http://localhost:3000/tasks?sortBy=createdAt&sortOrder=desc"

# Сортировка по приоритету (высокий сначала)
curl "http://localhost:3000/tasks?sortBy=priority&sortOrder=desc"

# Сортировка по названию (алфавитный порядок)
curl "http://localhost:3000/tasks?sortBy=title&sortOrder=asc"
```

## Ограничения и лимиты

| Параметр | Лимит |
|----------|-------|
| Размер запроса | 10 MB |
| Длина названия задачи | 200 символов |
| Длина описания | 1000 символов |
| Максимальный limit | 100 задач на страницу |
| Максимальная длина поискового запроса | 100 символов |

## Rate Limiting

В текущей версии rate limiting не реализован, но рекомендуется:
- Максимум 1000 запросов в минуту с одного IP
- Максимум 100 запросов в секунду

## CORS

API настроен для работы с любыми доменами. В production рекомендуется ограничить:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com']
}));
```
