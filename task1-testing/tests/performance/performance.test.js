const request = require('supertest');
const app = require('../../src/app');

describe('Performance Tests', () => {
  beforeEach(async () => {
    await request(app).delete('/tasks');
  });

  describe('Response Time Tests', () => {
    test('should respond to health check in under 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    test('should respond to GET /tasks in under 100ms with empty dataset', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/tasks')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    test('should respond to POST /tasks in under 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/tasks')
        .send({ title: 'Performance Test Task' })
        .expect(201);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Load Tests', () => {
    test('should handle 100 sequential GET requests efficiently', async () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health').expect(200);
      }
      
      const duration = Date.now() - start;
      const averageTime = duration / 100;
      
      expect(averageTime).toBeLessThan(50); // Average under 50ms per request
    }, 10000);

    test('should handle 50 concurrent GET requests', async () => {
      const start = Date.now();
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(request(app).get('/health'));
      }
      
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;
      
      // All requests should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      
      // All requests should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 5000);

    test('should handle 20 concurrent task creations', async () => {
      const start = Date.now();
      
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/tasks')
            .send({ title: `Concurrent Task ${i}` })
        );
      }
      
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;
      
      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      
      // All tasks should be created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Verify all tasks exist
      const allTasks = await request(app).get('/tasks?limit=20');
      expect(allTasks.body.tasks).toHaveLength(20);
    }, 5000);
  });

  describe('Scalability Tests', () => {
    test('should maintain performance with 1000 tasks', async () => {
      // Create 1000 tasks
      const createPromises = [];
      for (let i = 1; i <= 1000; i++) {
        createPromises.push(
          request(app)
            .post('/tasks')
            .send({
              title: `Scale Test Task ${i}`,
              description: `Description for task ${i}`,
              priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'
            })
        );
      }
      
      await Promise.all(createPromises);
      
      // Test GET performance with large dataset
      const start = Date.now();
      
      const response = await request(app)
        .get('/tasks?limit=100')
        .expect(200);
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200); // Should still be fast
      expect(response.body.tasks).toHaveLength(100);
      expect(response.body.pagination.total).toBe(1000);
    }, 30000);

    test('should handle search efficiently with large dataset', async () => {
      // Create 500 tasks with searchable content
      const createPromises = [];
      for (let i = 1; i <= 500; i++) {
        createPromises.push(
          request(app)
            .post('/tasks')
            .send({
              title: i % 10 === 0 ? `Important Task ${i}` : `Regular Task ${i}`,
              description: `This is task number ${i}`
            })
        );
      }
      
      await Promise.all(createPromises);
      
      // Test search performance
      const start = Date.now();
      
      const response = await request(app)
        .get('/tasks?search=Important')
        .expect(200);
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(150);
      expect(response.body.tasks.length).toBeGreaterThan(0); // Should find some "Important" tasks
    }, 20000);

    test('should handle pagination efficiently with large dataset', async () => {
      // Create 200 tasks
      const createPromises = [];
      for (let i = 1; i <= 200; i++) {
        createPromises.push(
          request(app)
            .post('/tasks')
            .send({ title: `Pagination Task ${i}` })
        );
      }
      
      await Promise.all(createPromises);
      
      // Test pagination performance
      const pageTests = [];
      for (let page = 1; page <= 10; page++) {
        pageTests.push(
          request(app)
            .get(`/tasks?page=${page}&limit=20`)
            .expect(200)
            .then(response => {
              expect(response.body.tasks).toHaveLength(20);
              expect(response.body.pagination.page).toBe(page);
            })
        );
      }
      
      const start = Date.now();
      await Promise.all(pageTests);
      const duration = Date.now() - start;
      
      // All pagination requests should complete quickly
      expect(duration).toBeLessThan(500);
    }, 15000);
  });

  describe('Memory Usage Tests', () => {
    test('should not cause significant memory leaks during rapid operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const createResponse = await request(app)
          .post('/tasks')
          .send({ title: `Memory Test Task ${i}` });
        
        const taskId = createResponse.body.id;
        
        await request(app)
          .put(`/tasks/${taskId}`)
          .send({ completed: true });
        
        await request(app)
          .get(`/tasks/${taskId}`);
        
        await request(app)
          .delete(`/tasks/${taskId}`);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 30000);

    test('should handle repeated task listing without memory buildup', async () => {
      // Create some tasks
      for (let i = 1; i <= 50; i++) {
        await request(app)
          .post('/tasks')
          .send({ title: `Memory Task ${i}` });
      }
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many GET requests
      for (let i = 0; i < 200; i++) {
        await request(app).get('/tasks?limit=10');
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable for 200 requests
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
    }, 20000);
  });

  describe('Stress Tests', () => {
    test('should handle mixed operations under load', async () => {
      const operations = [];
      
      // Mix of different operations
      for (let i = 0; i < 100; i++) {
        if (i % 4 === 0) {
          // Create task
          operations.push(
            request(app)
              .post('/tasks')
              .send({ title: `Stress Task ${i}` })
          );
        } else if (i % 4 === 1) {
          // Get all tasks
          operations.push(request(app).get('/tasks'));
        } else if (i % 4 === 2) {
          // Health check
          operations.push(request(app).get('/health'));
        } else {
          // Search
          operations.push(request(app).get('/tasks?search=Stress'));
        }
      }
      
      const start = Date.now();
      const responses = await Promise.all(operations);
      const duration = Date.now() - start;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
      
      // All operations should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(500);
      });
    }, 10000);

    test('should maintain data consistency under concurrent modifications', async () => {
      // Create initial task
      const createResponse = await request(app)
        .post('/tasks')
        .send({ title: 'Consistency Test Task' });
      
      const taskId = createResponse.body.id;
      
      // Perform concurrent updates
      const updateOperations = [];
      for (let i = 0; i < 20; i++) {
        updateOperations.push(
          request(app)
            .put(`/tasks/${taskId}`)
            .send({ 
              title: `Updated Task ${i}`,
              completed: i % 2 === 0 
            })
        );
      }
      
      const responses = await Promise.all(updateOperations);
      
      // All updates should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Final task should exist and be valid
      const finalTask = await request(app).get(`/tasks/${taskId}`);
      expect(finalTask.status).toBe(200);
      expect(finalTask.body.id).toBe(taskId);
    }, 10000);
  });

  describe('Resource Limits', () => {
    test('should handle maximum allowed title length efficiently', async () => {
      const maxTitle = 'a'.repeat(200);
      
      const start = Date.now();
      
      const response = await request(app)
        .post('/tasks')
        .send({ title: maxTitle })
        .expect(201);
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
      expect(response.body.title).toBe(maxTitle);
    });

    test('should handle maximum allowed description length efficiently', async () => {
      const maxDescription = 'b'.repeat(1000);
      
      const start = Date.now();
      
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Max Description Task',
          description: maxDescription 
        })
        .expect(201);
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
      expect(response.body.description).toBe(maxDescription);
    });
  });
});
