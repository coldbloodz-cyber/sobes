# Примеры использования

## Полный пример интеграции

### JavaScript/Node.js клиент

```javascript
class TaskManager {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Получить все задачи
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `/tasks?${params}` : '/tasks';
    return this.request(endpoint);
  }

  // Создать задачу
  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  // Обновить задачу
  async updateTask(id, updates) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Удалить задачу
  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  // Поиск задач
  async searchTasks(query, options = {}) {
    return this.getTasks({ search: query, ...options });
  }
}

// Использование
const taskManager = new TaskManager();

async function example() {
  try {
    // Создание задачи
    const newTask = await taskManager.createTask({
      title: 'Разработать новую функцию',
      description: 'Реализовать систему уведомлений',
      priority: 'high'
    });
    console.log('Создана задача:', newTask);

    // Получение задач с фильтрацией
    const urgentTasks = await taskManager.getTasks({
      priority: 'high',
      completed: false
    });
    console.log('Срочные задачи:', urgentTasks);

    // Поиск
    const foundTasks = await taskManager.searchTasks('уведомления');
    console.log('Найденные задачи:', foundTasks);

    // Обновление
    const updated = await taskManager.updateTask(newTask.id, {
      completed: true
    });
    console.log('Обновленная задача:', updated);

  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

example();
```

### React компонент

```jsx
import React, { useState, useEffect } from 'react';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const API_BASE = 'http://localhost:3000';

  // Загрузка задач
  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?completed=${filter === 'completed'}` : '';
      const response = await fetch(`${API_BASE}/tasks${params}`);
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  };

  // Создание задачи
  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      
      if (response.ok) {
        setNewTask({ title: '', description: '' });
        loadTasks();
      }
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    }
  };

  // Переключение статуса
  const toggleTask = async (id, completed) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      loadTasks();
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  // Удаление задачи
  const deleteTask = async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      loadTasks();
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filter]);

  return (
    <div className="task-manager">
      <h1>Менеджер задач</h1>
      
      {/* Форма создания */}
      <form onSubmit={createTask} className="task-form">
        <input
          type="text"
          placeholder="Название задачи"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Описание (опционально)"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <button type="submit">Создать задачу</button>
      </form>

      {/* Фильтры */}
      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Невыполненные
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Выполненные
        </button>
      </div>

      {/* Список задач */}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <div key={task.id} className={`task ${task.completed ? 'completed' : ''}`}>
              <div className="task-content">
                <h3>{task.title}</h3>
                {task.description && <p>{task.description}</p>}
                <span className={`priority ${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              <div className="task-actions">
                <button onClick={() => toggleTask(task.id, task.completed)}>
                  {task.completed ? 'Отменить' : 'Выполнить'}
                </button>
                <button onClick={() => deleteTask(task.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
```

### Python клиент

```python
import requests
import json
from typing import Dict, List, Optional

class TaskManagerClient:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Базовый метод для запросов"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        if not response.ok:
            error_data = response.json()
            raise Exception(f"API Error: {error_data.get('error', 'Unknown error')}")
        
        return response.json()

    def get_tasks(self, **filters) -> Dict:
        """Получить список задач с фильтрами"""
        params = {k: v for k, v in filters.items() if v is not None}
        return self._request('GET', '/tasks', params=params)

    def get_task(self, task_id: str) -> Dict:
        """Получить конкретную задачу"""
        return self._request('GET', f'/tasks/{task_id}')

    def create_task(self, title: str, description: str = None, 
                   priority: str = 'medium', completed: bool = False) -> Dict:
        """Создать новую задачу"""
        data = {
            'title': title,
            'completed': completed,
            'priority': priority
        }
        if description:
            data['description'] = description
            
        return self._request('POST', '/tasks', json=data)

    def update_task(self, task_id: str, **updates) -> Dict:
        """Обновить существующую задачу"""
        return self._request('PUT', f'/tasks/{task_id}', json=updates)

    def delete_task(self, task_id: str) -> Dict:
        """Удалить задачу"""
        return self._request('DELETE', f'/tasks/{task_id}')

    def clear_all_tasks(self) -> Dict:
        """Удалить все задачи"""
        return self._request('DELETE', '/tasks')

    def search_tasks(self, query: str, **additional_filters) -> Dict:
        """Поиск задач по тексту"""
        filters = {'search': query, **additional_filters}
        return self.get_tasks(**filters)

    def get_health(self) -> Dict:
        """Проверить статус сервера"""
        return self._request('GET', '/health')

# Пример использования
def main():
    client = TaskManagerClient()
    
    try:
        # Проверка связи с сервером
        health = client.get_health()
        print(f"Сервер работает: {health['status']}")
        
        # Создание задач
        tasks_data = [
            {
                'title': 'Изучить Python',
                'description': 'Пройти курс по Python разработке',
                'priority': 'high'
            },
            {
                'title': 'Написать тесты',
                'description': 'Покрыть тестами новый функционал',
                'priority': 'medium'
            },
            {
                'title': 'Обновить документацию',
                'priority': 'low'
            }
        ]
        
        created_tasks = []
        for task_data in tasks_data:
            task = client.create_task(**task_data)
            created_tasks.append(task)
            print(f"Создана задача: {task['title']}")
        
        # Получение всех задач
        all_tasks = client.get_tasks()
        print(f"\nВсего задач: {all_tasks['pagination']['total']}")
        
        # Фильтрация по приоритету
        high_priority = client.get_tasks(priority='high')
        print(f"Задач высокого приоритета: {len(high_priority['tasks'])}")
        
        # Поиск
        python_tasks = client.search_tasks('Python')
        print(f"Задач по Python: {len(python_tasks['tasks'])}")
        
        # Обновление задачи
        if created_tasks:
            first_task = created_tasks[0]
            updated = client.update_task(first_task['id'], completed=True)
            print(f"Задача '{updated['title']}' отмечена как выполненная")
        
        # Получение статистики
        completed = client.get_tasks(completed=True)
        pending = client.get_tasks(completed=False)
        print(f"\nСтатистика:")
        print(f"Выполнено: {len(completed['tasks'])}")
        print(f"В процессе: {len(pending['tasks'])}")
        
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    main()
```

### cURL скрипты

```bash
#!/bin/bash
# task_manager.sh - Набор утилит для работы с Task API

API_BASE="http://localhost:3000"

# Функции для работы с API
health_check() {
    echo "🏥 Проверка состояния сервера..."
    curl -s "$API_BASE/health" | jq '.'
}

create_task() {
    local title="$1"
    local description="$2"
    local priority="${3:-medium}"
    
    echo "➕ Создание задачи: $title"
    curl -s -X POST "$API_BASE/tasks" \
        -H "Content-Type: application/json" \
        -d "{\"title\": \"$title\", \"description\": \"$description\", \"priority\": \"$priority\"}" | jq '.'
}

list_tasks() {
    local filter="$1"
    echo "📋 Список задач..."
    
    if [ -n "$filter" ]; then
        curl -s "$API_BASE/tasks?$filter" | jq '.tasks[]'
    else
        curl -s "$API_BASE/tasks" | jq '.tasks[]'
    fi
}

search_tasks() {
    local query="$1"
    echo "🔍 Поиск: $query"
    curl -s "$API_BASE/tasks?search=$(echo "$query" | jq -sRr @uri)" | jq '.tasks[]'
}

complete_task() {
    local task_id="$1"
    echo "✅ Отмечаем задачу как выполненную: $task_id"
    curl -s -X PUT "$API_BASE/tasks/$task_id" \
        -H "Content-Type: application/json" \
        -d '{"completed": true}' | jq '.'
}

delete_task() {
    local task_id="$1"
    echo "🗑️ Удаление задачи: $task_id"
    curl -s -X DELETE "$API_BASE/tasks/$task_id" | jq '.'
}

# Интерактивное меню
show_menu() {
    echo ""
    echo "🚀 Task Manager CLI"
    echo "1. Проверить сервер"
    echo "2. Создать задачу"
    echo "3. Показать все задачи"
    echo "4. Показать активные задачи"
    echo "5. Поиск задач"
    echo "6. Отметить задачу выполненной"
    echo "7. Удалить задачу"
    echo "0. Выход"
    echo ""
}

# Основной цикл
while true; do
    show_menu
    read -p "Выберите действие: " choice
    
    case $choice in
        1)
            health_check
            ;;
        2)
            read -p "Название задачи: " title
            read -p "Описание: " description
            read -p "Приоритет (low/medium/high): " priority
            create_task "$title" "$description" "$priority"
            ;;
        3)
            list_tasks
            ;;
        4)
            list_tasks "completed=false"
            ;;
        5)
            read -p "Поисковый запрос: " query
            search_tasks "$query"
            ;;
        6)
            read -p "ID задачи: " task_id
            complete_task "$task_id"
            ;;
        7)
            read -p "ID задачи: " task_id
            delete_task "$task_id"
            ;;
        0)
            echo "До свидания!"
            exit 0
            ;;
        *)
            echo "Неверный выбор"
            ;;
    esac
    
    read -p "Нажмите Enter для продолжения..."
done
```

## Продвинутые примеры

### Пагинация и сортировка

```javascript
// Получение задач с пагинацией
async function getTasksWithPagination(page = 1, limit = 10) {
    const response = await fetch(`/tasks?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    return {
        tasks: data.tasks,
        pagination: data.pagination,
        hasNext: data.pagination.page < data.pagination.pages,
        hasPrev: data.pagination.page > 1
    };
}

// Сортировка по различным полям
const sortOptions = [
    { field: 'createdAt', order: 'desc', label: 'По дате создания (новые)' },
    { field: 'createdAt', order: 'asc', label: 'По дате создания (старые)' },
    { field: 'priority', order: 'desc', label: 'По приоритету (высокий)' },
    { field: 'title', order: 'asc', label: 'По алфавиту' }
];

async function getSortedTasks(sortBy, sortOrder) {
    const response = await fetch(`/tasks?sortBy=${sortBy}&sortOrder=${sortOrder}`);
    return response.json();
}
```

### Batch операции

```javascript
// Массовое обновление задач
async function completeMultipleTasks(taskIds) {
    const promises = taskIds.map(id => 
        fetch(`/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true })
        })
    );
    
    const results = await Promise.allSettled(promises);
    return results.map((result, index) => ({
        taskId: taskIds[index],
        success: result.status === 'fulfilled',
        error: result.reason?.message
    }));
}

// Создание нескольких задач
async function createMultipleTasks(tasksData) {
    const promises = tasksData.map(taskData =>
        fetch('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        }).then(r => r.json())
    );
    
    return Promise.all(promises);
}
```

### Обработка ошибок

```javascript
class TaskAPIError extends Error {
    constructor(message, status, details) {
        super(message);
        this.name = 'TaskAPIError';
        this.status = status;
        this.details = details;
    }
}

async function safeRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new TaskAPIError(
                errorData.error || 'Request failed',
                response.status,
                errorData.details
            );
        }
        
        return response.json();
    } catch (error) {
        if (error instanceof TaskAPIError) {
            throw error;
        }
        
        // Сетевые ошибки
        throw new TaskAPIError(
            'Network error: Unable to connect to server',
            0,
            [error.message]
        );
    }
}

// Использование с обработкой ошибок
async function handleTaskCreation(taskData) {
    try {
        const task = await safeRequest('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        console.log('Задача создана:', task);
        return task;
    } catch (error) {
        if (error instanceof TaskAPIError) {
            if (error.status === 400 && error.details) {
                console.error('Ошибки валидации:', error.details);
            } else {
                console.error('API ошибка:', error.message);
            }
        } else {
            console.error('Неизвестная ошибка:', error);
        }
        throw error;
    }
}
```

Эти примеры показывают различные способы интеграции с Task Management API в реальных приложениях, включая обработку ошибок, пагинацию и массовые операции.
