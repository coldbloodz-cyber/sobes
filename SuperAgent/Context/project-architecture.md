# Архитектура проекта

## Структура файлов

```
SOBES/
├── SuperAgent/
│   ├── tech-structure.md          # Технические настройки проекта
│   ├── project-brief.md           # Детальное описание тестового задания
│   └── Context/
│       ├── project-architecture.md # Текущий файл - архитектура проекта
│       └── iterations-log.md      # Лог всех итераций и изменений
├── task1-testing/               # ✅ ЗАВЕРШЕНО: Приложение + полные тесты
│   ├── src/
│   │   ├── app.js              # Express REST API для управления задачами
│   │   └── server.js           # Точка входа с graceful shutdown
│   ├── tests/
│   │   ├── unit/               # 15 юнит тестов (валидация, утилиты)
│   │   ├── integration/        # 24 интеграционных теста (API endpoints)
│   │   ├── edge-cases/         # 34 edge case теста (граничные случаи)
│   │   ├── performance/        # 15 performance тестов (нагрузка, память)
│   │   └── setup.js            # Настройка тестовой среды
│   ├── package.json            # Зависимости и тестовые скрипты
│   ├── jest.config.js          # Конфигурация Jest
│   ├── performance-config.yml  # Конфигурация Artillery для нагрузочного тестирования
│   └── README.md              # Документация приложения
├── task2-documentation/         # Задача 2: Документация
├── task3-unknown-language/      # ✅ ЗАВЕРШЕНО: Go HTTP-сервер с SQLite
│   ├── main.go                 # REST API с полным CRUD
│   ├── go.mod                  # Go модули и зависимости
│   ├── go.sum                  # Суммы зависимостей
│   ├── users.db                # SQLite база данных
│   └── README.md              # Документация Go сервера
└── AI_WORKFLOW.md              # Документация процесса работы с AI
```

## Схема зависимостей

```
SuperAgent/
├── tech-structure.md → определяет технические стандарты для всех задач
└── project-brief.md → содержит требования для трех задач

task1-testing/ ✅ ЗАВЕРШЕНО
├── src/
│   ├── app.js → Express сервер с полным CRUD API для задач
│   │           ├── GET /tasks (фильтрация, пагинация, поиск)
│   │           ├── POST /tasks (создание с валидацией)
│   │           ├── PUT /tasks/:id (обновление)
│   │           ├── DELETE /tasks/:id (удаление)
│   │           └── GET /health (health check)
│   └── server.js → точка входа с graceful shutdown
├── tests/
│   ├── unit/ → 15 тестов валидации и бизнес-логики
│   ├── integration/ → 24 теста полного API тестирования
│   ├── edge-cases/ → 34 теста граничных случаев и ошибок
│   └── performance/ → 15 тестов производительности и нагрузки
└── package.json → зависимости (express, jest, supertest, artillery)

📊 Покрытие тестами:
- 94.4% общее покрытие кода
- 97.1% покрытие веток
- 100% покрытие функций  
- 88 тестов из 88 прошли успешно

task2-documentation/
└── документация для приложения из task1-testing/

task3-unknown-language/
└── независимое Go приложение с собственной архитектурой

AI_WORKFLOW.md → документирует процесс работы со всеми задачами
```

## Описание модулей

### SuperAgent (Система управления контекстом)
- **tech-structure.md**: Конфигурация проекта, технические стандарты
- **project-brief.md**: Полное техническое задание с требованиями
- **Context/**: Папка для управления контекстом разработки
  - **project-architecture.md**: Архитектура и структура проекта
  - **iterations-log.md**: История всех изменений и решений

### Задача 1: Testing (task1-testing/) ✅ ЗАВЕРШЕНО
- **Назначение**: Создание приложения и полного набора тестов
- **Технологии**: Node.js, Express, Jest, Supertest, Artillery
- **Архитектура**: REST API с CRUD операциями для управления задачами
- **Функциональность**: 
  - Полный CRUD (Create, Read, Update, Delete)
  - Фильтрация, пагинация, поиск
  - Валидация входных данных
  - Health check endpoint
- **Тестирование**: 
  - 88 тестов (100% прошли)
  - Unit тесты (15) - валидация, бизнес-логика
  - Integration тесты (24) - API endpoints 
  - Edge cases (34) - граничные случаи, ошибки
  - Performance тесты (15) - производительность, нагрузка
- **Покрытие**: 94.4% кода, 97.1% веток, 100% функций

### Задача 2: Documentation (task2-documentation/)
- **Назначение**: Создание профессиональной документации
- **Зависимости**: Документирует приложение из task1-testing/
- **Компоненты**: README, API docs, примеры, troubleshooting

### Задача 3: Unknown Language (task3-unknown-language/) ✅ ЗАВЕРШЕНО
- **Назначение**: HTTP-сервер на незнакомом языке (Go)
- **Технологии**: Go 1.25, gorilla/mux, mattn/go-sqlite3
- **Архитектура**: REST API с валидацией и SQLite базой данных
- **Функциональность**:
  - 4 endpoints: GET /users, POST /users, PUT /users/:id, DELETE /users/:id
  - Health check endpoint: GET /health
  - Полная валидация входных данных
  - CORS и logging middleware
  - SQLite персистентное хранение
- **Результат**: Полнофункциональный REST API с валидацией и базой данных
- **Независимость**: Отдельное приложение, не связанное с задачами 1-2
