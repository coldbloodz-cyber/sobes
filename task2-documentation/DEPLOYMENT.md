# Руководство по развертыванию

## Развертывание в различных средах

### 🖥️ Локальная разработка

#### Требования
- Node.js 16+ 
- npm 7+
- Git

#### Быстрый старт
```bash
# Клонирование репозитория
git clone <repository-url>
cd task1-testing

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

#### Настройка окружения
Создайте файл `.env`:
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
CORS_ORIGIN=*
```

### ☁️ Production развертывание

#### Подготовка к production
```bash
# Установка только production зависимостей
npm ci --only=production

# Оптимизация для production
export NODE_ENV=production
```

#### Системные требования
- **CPU**: 1 vCPU (минимум)
- **RAM**: 512MB (минимум), 1GB (рекомендуется)
- **Диск**: 100MB свободного места
- **Node.js**: 16.x или выше

### 🐳 Docker развертывание

#### Dockerfile
```dockerfile
# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код
COPY src/ ./src/

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Открываем порт
EXPOSE 3000

# Определяем команду запуска
CMD ["node", "src/server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  task-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - task-api
    restart: unless-stopped
```

#### Команды Docker
```bash
# Сборка образа
docker build -t task-management-api .

# Запуск контейнера
docker run -d -p 3000:3000 --name task-api task-management-api

# Просмотр логов
docker logs task-api

# Остановка и удаление
docker stop task-api
docker rm task-api
```

### 🌐 Nginx конфигурация

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream task_api {
        server task-api:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name yourdomain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API proxy
        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://task_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://task_api/health;
            access_log off;
        }
    }
}
```

### ☁️ Облачные платформы

#### Heroku
1. **Создание приложения**:
   ```bash
   heroku create your-task-api
   ```

2. **Конфигурация**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3000
   ```

3. **Procfile**:
   ```
   web: node src/server.js
   ```

4. **Развертывание**:
   ```bash
   git push heroku main
   ```

#### Vercel
1. **vercel.json**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/src/server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

2. **Развертывание**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

#### AWS EC2
1. **Создание инстанса**:
   - Amazon Linux 2
   - t3.micro (для начала)
   - Security Group: порты 22, 80, 443

2. **Установка Node.js**:
   ```bash
   # Подключение к серверу
   ssh -i your-key.pem ec2-user@your-server-ip

   # Установка Node.js
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   ```

3. **Развертывание приложения**:
   ```bash
   # Клонирование репозитория
   git clone <your-repo-url>
   cd task1-testing

   # Установка зависимостей
   npm ci --only=production

   # Установка PM2 для управления процессами
   npm install -g pm2

   # Запуск приложения
   pm2 start src/server.js --name "task-api"
   pm2 startup
   pm2 save
   ```

### 🔄 CI/CD Pipeline

#### GitHub Actions
`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run coverage
      run: npm run test:coverage

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t task-api .
    
    - name: Deploy to production
      env:
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
      run: |
        echo "$DEPLOY_KEY" > deploy_key
        chmod 600 deploy_key
        
        # Копирование файлов на сервер
        scp -i deploy_key -o StrictHostKeyChecking=no -r . $DEPLOY_USER@$DEPLOY_HOST:/app
        
        # Перезапуск сервиса
        ssh -i deploy_key -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST '
          cd /app &&
          npm ci --only=production &&
          pm2 restart task-api
        '
```

### 📊 Мониторинг и логирование

#### PM2 мониторинг
```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs task-api

# Мониторинг в реальном времени
pm2 monit

# Перезапуск при превышении памяти
pm2 start src/server.js --name task-api --max-memory-restart 300M
```

#### Системный мониторинг
```bash
# Создание systemd сервиса
sudo tee /etc/systemd/system/task-api.service > /dev/null <<EOF
[Unit]
Description=Task Management API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/app
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Активация сервиса
sudo systemctl daemon-reload
sudo systemctl enable task-api
sudo systemctl start task-api
```

### 🔒 Безопасность в production

#### Переменные окружения
```bash
# Никогда не коммитьте .env файл!
echo ".env" >> .gitignore

# Используйте secrets management
export NODE_ENV=production
export PORT=3000
export CORS_ORIGIN=https://yourdomain.com
export API_SECRET=your-secret-key
```

#### SSL/TLS сертификаты
```bash
# Получение бесплатного SSL сертификата
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

#### Firewall настройки
```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3000   # Прямой доступ к приложению
```

### 🚀 Автоматическое масштабирование

#### Docker Swarm
```yaml
# docker-stack.yml
version: '3.8'

services:
  task-api:
    image: task-api:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - task-network

networks:
  task-network:
    driver: overlay
```

#### Kubernetes
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: task-api
  template:
    metadata:
      labels:
        app: task-api
    spec:
      containers:
      - name: task-api
        image: task-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 🔍 Диагностика проблем

#### Проверочный чек-лист
```bash
# 1. Проверка сервиса
curl -f http://localhost:3000/health || echo "Service down"

# 2. Проверка логов
pm2 logs task-api --lines 100

# 3. Проверка ресурсов
free -m
df -h
top -p $(pgrep node)

# 4. Проверка сети
netstat -tlnp | grep :3000
```

#### Откат к предыдущей версии
```bash
# PM2
pm2 stop task-api
git checkout previous-working-commit
npm ci --only=production
pm2 start task-api

# Docker
docker stop task-api
docker run -d --name task-api-backup task-api:previous-version
```

### 📋 Checklist развертывания

- [ ] Тесты проходят локально
- [ ] Переменные окружения настроены
- [ ] SSL сертификаты установлены
- [ ] Firewall настроен
- [ ] Мониторинг подключен
- [ ] Резервное копирование настроено
- [ ] Процедура отката готова
- [ ] Health checks работают
- [ ] Логирование настроено
- [ ] Performance тестирование проведено

Этот гайд обеспечивает полное покрытие процесса развертывания от локальной разработки до production-ready кластера с автоматическим масштабированием.
