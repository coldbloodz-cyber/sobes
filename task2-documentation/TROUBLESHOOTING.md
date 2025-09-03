# Руководство по решению проблем

## Часто встречающиеся проблемы

### 🚫 Сервер не запускается

#### Проблема: `Error: listen EADDRINUSE`
```
Error: listen EADDRINUSE :::3000
```

**Причина**: Порт 3000 уже занят другим процессом

**Решения**:
1. **Остановить процесс на порту 3000**:
   ```bash
   # Найти процесс
   lsof -i :3000
   
   # Остановить процесс (замените PID на найденный)
   kill -9 <PID>
   ```

2. **Использовать другой порт**:
   ```bash
   PORT=3001 npm start
   ```

3. **Через переменную окружения**:
   ```bash
   echo "PORT=3001" >> .env
   npm start
   ```

#### Проблема: `Cannot find module`
```
Error: Cannot find module 'express'
```

**Причина**: Зависимости не установлены

**Решение**:
```bash
# Удалить node_modules и package-lock.json
rm -rf node_modules package-lock.json

# Переустановить зависимости
npm install

# Проверить установку
npm list
```

#### Проблема: `Permission denied`
```
Error: EACCES: permission denied, open '/app/data'
```

**Причина**: Недостаточно прав доступа

**Решение**:
```bash
# Изменить владельца папки
sudo chown -R $USER:$USER .

# Или изменить права
chmod 755 .
```

### 🌐 Проблемы с API запросами

#### Проблема: `CORS policy error`
```
Access to fetch at 'http://localhost:3000/tasks' from origin 'http://localhost:8080' 
has been blocked by CORS policy
```

**Причина**: CORS ограничения

**Решения**:
1. **Настроить CORS в приложении**:
   ```javascript
   // В src/app.js добавить конкретные домены
   app.use(cors({
     origin: ['http://localhost:8080', 'http://localhost:3001'],
     credentials: true
   }));
   ```

2. **Использовать прокси в development**:
   ```javascript
   // В package.json клиентского приложения
   "proxy": "http://localhost:3000"
   ```

3. **Временное решение - отключить CORS в браузере**:
   ```bash
   # Chrome с отключенным CORS (только для разработки!)
   google-chrome --disable-web-security --user-data-dir="/tmp/chrome"
   ```

#### Проблема: `404 Not Found`
```
Cannot GET /api/tasks
```

**Причина**: Неправильный URL или эндпоинт не существует

**Решение**:
1. **Проверить правильность URL**:
   ```javascript
   // Правильно
   fetch('http://localhost:3000/tasks')
   
   // Неправильно
   fetch('http://localhost:3000/api/tasks')
   ```

2. **Проверить что сервер запущен**:
   ```bash
   curl http://localhost:3000/health
   ```

#### Проблема: `500 Internal Server Error`
```
{"error": "Internal server error"}
```

**Причина**: Ошибка в коде сервера

**Диагностика**:
1. **Проверить логи сервера** в консоли
2. **Проверить Node.js версию**:
   ```bash
   node --version  # Должно быть 16+
   ```
3. **Запустить в debug режиме**:
   ```bash
   NODE_ENV=development npm start
   ```

### 🧪 Проблемы с тестами

#### Проблема: Тесты падают с timeout
```
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Решения**:
1. **Увеличить timeout в Jest**:
   ```javascript
   // В jest.config.js
   module.exports = {
     testTimeout: 30000  // 30 секунд
   };
   ```

2. **Использовать async/await правильно**:
   ```javascript
   // Правильно
   test('should create task', async () => {
     const response = await request(app)
       .post('/tasks')
       .send({ title: 'Test' });
     expect(response.status).toBe(201);
   });
   ```

#### Проблема: `Jest has detected open handles`
```
Jest has detected the following 1 open handle potentially keeping Jest from exiting
```

**Причина**: Незакрытые соединения или таймеры

**Решение**:
```javascript
// В tests/setup.js
afterAll(async () => {
  // Закрыть все соединения
  await new Promise(resolve => {
    server.close(resolve);
  });
});
```

#### Проблема: Тесты влияют друг на друга
```
Expected 1 task but got 3
```

**Причина**: Данные не очищаются между тестами

**Решение**:
```javascript
// В каждом тестовом файле
beforeEach(async () => {
  // Очистить все задачи
  await request(app).delete('/tasks');
});
```

### 💾 Проблемы с данными

#### Проблема: Данные не сохраняются
**Причина**: Приложение использует in-memory хранилище

**Решение**: Данные теряются при перезапуске - это нормальное поведение для тестового приложения

#### Проблема: `Validation failed`
```json
{
  "error": "Validation failed",
  "details": ["Title is required and must be a non-empty string"]
}
```

**Причина**: Неправильные данные в запросе

**Проверка**:
```javascript
// Правильный формат данных
const taskData = {
  title: "Название задачи",        // Обязательно, 1-200 символов
  description: "Описание",         // Опционально, до 1000 символов
  priority: "medium",              // low/medium/high
  completed: false                 // boolean
};
```

### 🔧 Проблемы производительности

#### Проблема: Медленные ответы API
**Диагностика**:
```bash
# Проверить время отклика
curl -w "Time: %{time_total}s\n" http://localhost:3000/tasks

# Нагрузочное тестирование
npm run test:load
```

**Решения**:
1. **Добавить лимиты на запросы**:
   ```javascript
   app.get('/tasks', (req, res) => {
     const limit = Math.min(parseInt(req.query.limit) || 10, 100);
     // ... остальной код
   });
   ```

2. **Добавить кэширование** (для production):
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 600 }); // 10 минут
   ```

#### Проблема: Высокое потребление памяти
**Диагностика**:
```bash
# Мониторинг памяти
curl http://localhost:3000/health | jq '.memory'
```

**Решения**:
1. **Ограничить размер массивов**
2. **Добавить garbage collection**:
   ```bash
   node --max-old-space-size=512 src/server.js
   ```

### 🐛 Отладка

#### Включение детального логирования
```javascript
// В src/app.js
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
  
  // Логирование всех запросов
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

#### Использование отладчика Node.js
```bash
# Запуск с отладчиком
node --inspect src/server.js

# Или через npm script
npm run debug
```

#### Логирование ошибок
```javascript
// Добавить в src/app.js
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});
```

### 🔍 Полезные команды для диагностики

```bash
# Проверка статуса сервера
curl -I http://localhost:3000/health

# Проверка всех эндпоинтов
curl http://localhost:3000/tasks
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"test"}'

# Проверка памяти и процессов
ps aux | grep node
free -m

# Проверка портов
netstat -tlnp | grep :3000

# Проверка логов
tail -f ~/.npm/_logs/*.log

# Проверка версий
node --version
npm --version
```

### 📞 Получение помощи

#### Сбор информации для отчета об ошибке
```bash
# Создать отчет о системе
echo "=== System Info ===" > debug-report.txt
echo "Node.js: $(node --version)" >> debug-report.txt
echo "npm: $(npm --version)" >> debug-report.txt
echo "OS: $(uname -a)" >> debug-report.txt
echo "" >> debug-report.txt

echo "=== Package versions ===" >> debug-report.txt
npm list >> debug-report.txt
echo "" >> debug-report.txt

echo "=== Error logs ===" >> debug-report.txt
# Добавить релевантные логи ошибок
```

#### Шаблон для сообщения об ошибке
```markdown
## Описание проблемы
[Краткое описание что происходит]

## Шаги воспроизведения
1. 
2. 
3. 

## Ожидаемое поведение
[Что должно происходить]

## Фактическое поведение
[Что происходит на самом деле]

## Окружение
- Node.js: [версия]
- npm: [версия]
- OS: [операционная система]

## Логи ошибок
```
[вставить логи]
```

## Дополнительная информация
[любая дополнительная информация]
```

### 🎯 Быстрые решения

| Проблема | Быстрое решение |
|----------|----------------|
| Порт занят | `PORT=3001 npm start` |
| CORS ошибка | Добавить origin в настройки CORS |
| 404 ошибка | Проверить URL эндпоинта |
| Валидация | Проверить формат данных |
| Тесты падают | `npm run test:unit` вместо `npm test` |
| Сервер не отвечает | Перезапустить: `npm run dev` |
| Зависимости | `rm -rf node_modules && npm install` |
| Память | Перезапустить приложение |

Если проблема не решается стандартными способами, обратитесь к разработчикам с детальным описанием и логами ошибок.
