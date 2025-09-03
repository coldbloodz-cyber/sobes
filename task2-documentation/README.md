# Task Management API

![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)
![Express](https://img.shields.io/badge/Express-5.1.x-blue)
![Tests](https://img.shields.io/badge/Tests-88%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-94.4%25-brightgreen)

Профессиональный REST API для управления задачами, разработанный с использованием Express.js. Включает полную CRUD функциональность, продвинутую фильтрацию, валидацию данных и исчерпывающее тестовое покрытие.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 16+ 
- npm 7+

### Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd task1-testing

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Или в production режиме
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

### Быстрая проверка

```bash
# Проверка работоспособности
curl http://localhost:3000/health

# Получение списка задач
curl http://localhost:3000/tasks

# Создание новой задачи
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Моя первая задача", "description": "Описание задачи"}'
```

## 📋 Возможности

### Основная функциональность
- ✅ **Полный CRUD** - создание, чтение, обновление, удаление задач
- ✅ **Умная фильтрация** - по статусу, приоритету, дате создания
- ✅ **Пагинация** - настраиваемый размер страницы и навигация
- ✅ **Поиск** - полнотекстовый поиск по названию и описанию
- ✅ **Валидация** - проверка входных данных и ограничений
- ✅ **Health check** - мониторинг состояния сервера

### Дополнительные возможности
- 🔒 **Безопасность** - Helmet.js защита, CORS настройки
- 📝 **Логирование** - детальные логи с Morgan
- ⚡ **Производительность** - оптимизированные запросы
- 🧪 **Тестирование** - 94.4% покрытие кода, 88 тестов

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Сервер
PORT=3000
NODE_ENV=development

# Логирование
LOG_LEVEL=info

# Безопасность
CORS_ORIGIN=http://localhost:3000
```

### Настройки приложения

Основные настройки находятся в `src/app.js`:

```javascript
// Лимиты запросов
app.use(express.json({ limit: '10mb' }));

// CORS настройки
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
npm test

# Тесты с отслеживанием изменений
npm run test:watch

# Покрытие кода
npm run test:coverage

# Отдельные категории тестов
npm run test:unit        # Unit тесты
npm run test:integration # Интеграционные тесты
npm run test:edge        # Edge cases
npm run test:performance # Performance тесты
```

### Нагрузочное тестирование

```bash
# Artillery нагрузочные тесты
npm run test:load

# Или запуск Artillery напрямую
artillery run performance-config.yml
```

### Результаты тестирования

```
Test Suites: 4 passed, 4 total
Tests:       88 passed, 88 total
Snapshots:   0 total
Time:        ~7s
```

## 📈 Мониторинг и метрики

### Health Check

Endpoint для мониторинга состояния:

```bash
GET /health
```

Ответ включает:
- Статус сервера
- Время работы (uptime)
- Использование памяти
- Версия Node.js
- Timestamp

### Метрики производительности

API оптимизирован для:
- ⚡ Время отклика < 100ms для базовых операций
- 📊 Обработка до 1000+ запросов в минуту
- 💾 Эффективное использование памяти
- 🔄 Graceful shutdown при перезапуске

## 🏗️ Архитектура

### Структура проекта

```
task1-testing/
├── src/
│   ├── app.js              # Основное Express приложение
│   └── server.js           # Точка входа с graceful shutdown
├── tests/
│   ├── unit/               # Unit тесты (15 тестов)
│   ├── integration/        # API интеграционные тесты (24)
│   ├── edge-cases/         # Edge cases и error handling (34)
│   ├── performance/        # Performance тесты (15)
│   └── setup.js           # Настройка тестового окружения
├── package.json           # Зависимости и скрипты
├── jest.config.js         # Конфигурация Jest
└── performance-config.yml # Настройки Artillery
```

### Схема данных

```javascript
// Модель задачи
{
  id: "uuid",                    // Уникальный идентификатор
  title: "string",               // Название (обязательно, до 200 символов)
  description: "string",         // Описание (до 1000 символов)
  completed: boolean,            // Статус выполнения
  priority: "low|medium|high",   // Приоритет
  createdAt: "ISO 8601",         // Дата создания
  updatedAt: "ISO 8601"          // Дата последнего обновления
}
```

## 🤝 Контрибьюция

### Стандарты разработки

- **Стиль кода**: ESLint + Prettier
- **Коммиты**: Conventional Commits
- **Тестирование**: Обязательно для новых функций
- **Покрытие**: Минимум 90%

### Рабочий процесс

1. Форкните репозиторий
2. Создайте feature branch: `git checkout -b feature/amazing-feature`
3. Внесите изменения и добавьте тесты
4. Убедитесь, что все тесты проходят: `npm test`
5. Закоммитьте: `git commit -m 'feat: добавить amazing feature'`
6. Запушьте: `git push origin feature/amazing-feature`
7. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [Troubleshooting секцию](docs/TROUBLESHOOTING.md)
2. Просмотрите [существующие issues](issues)
3. Создайте новый issue с детальным описанием проблемы

---

**Сделано с ❤️ используя Express.js и лучшие практики Node.js разработки**
