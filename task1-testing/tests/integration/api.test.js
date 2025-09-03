const request = require('supertest');
const app = require('../../src/app');

describe('Task API Integration Tests', () => {
  // Clear tasks before each test
  beforeEach(async () => {
    await request(app).delete('/tasks');
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('GET /tasks', () => {
    test('should return empty array when no tasks exist', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body.tasks).toEqual([]);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
    });

    test('should return tasks with pagination', async () => {
      // Create multiple tasks
      const tasks = [];
      for (let i = 1; i <= 15; i++) {
        const task = await request(app)
          .post('/tasks')
          .send({
            title: `Task ${i}`,
            description: `Description ${i}`,
            priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'
          });
        tasks.push(task.body);
      }

      // Test first page
      const response1 = await request(app)
        .get('/tasks?page=1&limit=10')
        .expect(200);

      expect(response1.body.tasks).toHaveLength(10);
      expect(response1.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2
      });

      // Test second page
      const response2 = await request(app)
        .get('/tasks?page=2&limit=10')
        .expect(200);

      expect(response2.body.tasks).toHaveLength(5);
      expect(response2.body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 15,
        totalPages: 2
      });
    });

    test('should filter tasks by completion status', async () => {
      // Create completed and incomplete tasks
      await request(app)
        .post('/tasks')
        .send({ title: 'Completed Task', completed: true });

      await request(app)
        .post('/tasks')
        .send({ title: 'Incomplete Task', completed: false });

      // Filter completed tasks
      const completedResponse = await request(app)
        .get('/tasks?completed=true')
        .expect(200);

      expect(completedResponse.body.tasks).toHaveLength(1);
      expect(completedResponse.body.tasks[0].title).toBe('Completed Task');

      // Filter incomplete tasks
      const incompleteResponse = await request(app)
        .get('/tasks?completed=false')
        .expect(200);

      expect(incompleteResponse.body.tasks).toHaveLength(1);
      expect(incompleteResponse.body.tasks[0].title).toBe('Incomplete Task');
    });

    test('should filter tasks by priority', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'High Priority Task', priority: 'high' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Low Priority Task', priority: 'low' });

      const response = await request(app)
        .get('/tasks?priority=high')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].title).toBe('High Priority Task');
    });

    test('should search tasks by title and description', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Important Meeting', description: 'Discuss project timeline' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Buy Groceries', description: 'Milk, bread, eggs' });

      const response = await request(app)
        .get('/tasks?search=meeting')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].title).toBe('Important Meeting');
    });

    test('should sort tasks by different fields', async () => {
      const task1 = await request(app)
        .post('/tasks')
        .send({ title: 'A Task', priority: 'low' });

      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

      const task2 = await request(app)
        .post('/tasks')
        .send({ title: 'Z Task', priority: 'high' });

      // Sort by title ascending
      const titleAscResponse = await request(app)
        .get('/tasks?sortBy=title&sortOrder=asc')
        .expect(200);

      expect(titleAscResponse.body.tasks[0].title).toBe('A Task');
      expect(titleAscResponse.body.tasks[1].title).toBe('Z Task');

      // Sort by title descending
      const titleDescResponse = await request(app)
        .get('/tasks?sortBy=title&sortOrder=desc')
        .expect(200);

      expect(titleDescResponse.body.tasks[0].title).toBe('Z Task');
      expect(titleDescResponse.body.tasks[1].title).toBe('A Task');
    });
  });

  describe('GET /tasks/:id', () => {
    test('should return specific task', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({
          title: 'Test Task',
          description: 'Test description'
        });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .get(`/tasks/${taskId}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe('Test Task');
      expect(response.body.description).toBe('Test description');
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/tasks/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('POST /tasks', () => {
    test('should create new task with valid data', async () => {
      const taskData = {
        title: 'New Task',
        description: 'New task description',
        priority: 'high'
      };

      const response = await request(app)
        .post('/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.priority).toBe(taskData.priority);
      expect(response.body.completed).toBe(false);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    test('should create task with minimal data', async () => {
      const taskData = {
        title: 'Minimal Task'
      };

      const response = await request(app)
        .post('/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe('');
      expect(response.body.priority).toBe('medium');
      expect(response.body.completed).toBe(false);
    });

    test('should return 400 for invalid task data', async () => {
      const invalidTaskData = {
        title: '',
        description: 123,
        completed: 'invalid',
        priority: 'urgent'
      };

      const response = await request(app)
        .post('/tasks')
        .send(invalidTaskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveLength(4);
    });

    test('should trim whitespace from title', async () => {
      const taskData = {
        title: '  Trimmed Task  '
      };

      const response = await request(app)
        .post('/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe('Trimmed Task');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('should update existing task', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({
          title: 'Original Task',
          description: 'Original description'
        });

      const taskId = createResponse.body.id;
      const originalUpdatedAt = createResponse.body.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        completed: true,
        priority: 'high'
      };

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.completed).toBe(updateData.completed);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should partially update task', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({
          title: 'Original Task',
          description: 'Original description',
          priority: 'low'
        });

      const taskId = createResponse.body.id;

      const updateData = {
        completed: true
      };

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Original Task');
      expect(response.body.description).toBe('Original description');
      expect(response.body.priority).toBe('low');
      expect(response.body.completed).toBe(true);
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/tasks/non-existent-id')
        .send({ title: 'Updated Task' })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should return 400 for invalid update data', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send({ title: '', priority: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('should delete existing task', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({ title: 'Task to Delete' });

      const taskId = createResponse.body.id;

      await request(app)
        .delete(`/tasks/${taskId}`)
        .expect(204);

      // Verify task is deleted
      await request(app)
        .get(`/tasks/${taskId}`)
        .expect(404);
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/tasks/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks', () => {
    test('should delete all tasks', async () => {
      // Create multiple tasks
      await request(app).post('/tasks').send({ title: 'Task 1' });
      await request(app).post('/tasks').send({ title: 'Task 2' });
      await request(app).post('/tasks').send({ title: 'Task 3' });

      // Verify tasks exist
      const beforeResponse = await request(app).get('/tasks');
      expect(beforeResponse.body.tasks).toHaveLength(3);

      // Delete all tasks
      await request(app)
        .delete('/tasks')
        .expect(204);

      // Verify all tasks are deleted
      const afterResponse = await request(app).get('/tasks');
      expect(afterResponse.body.tasks).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title": "Test Task", "invalid": }')
        .expect(500); // JSON parser errors result in 500

      expect(response.body).toHaveProperty('error');
    });

    test('should handle large payloads gracefully', async () => {
      const largeTitle = 'a'.repeat(10000);
      
      const response = await request(app)
        .post('/tasks')
        .send({ title: largeTitle })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
