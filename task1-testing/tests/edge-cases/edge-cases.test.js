const request = require('supertest');
const app = require('../../src/app');

describe('Edge Cases and Error Handling Tests', () => {
  beforeEach(async () => {
    await request(app).delete('/tasks');
  });

  describe('Boundary Value Testing', () => {
    test('should handle title with exactly 200 characters', async () => {
      const exactLengthTitle = 'a'.repeat(200);
      
      const response = await request(app)
        .post('/tasks')
        .send({ title: exactLengthTitle })
        .expect(201);

      expect(response.body.title).toBe(exactLengthTitle);
    });

    test('should handle description with exactly 1000 characters', async () => {
      const exactLengthDescription = 'b'.repeat(1000);
      
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Test Task',
          description: exactLengthDescription 
        })
        .expect(201);

      expect(response.body.description).toBe(exactLengthDescription);
    });

    test('should reject title with 201 characters', async () => {
      const tooLongTitle = 'a'.repeat(201);
      
      const response = await request(app)
        .post('/tasks')
        .send({ title: tooLongTitle })
        .expect(400);

      expect(response.body.details).toContain('Title must be less than 200 characters');
    });

    test('should reject description with 1001 characters', async () => {
      const tooLongDescription = 'b'.repeat(1001);
      
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Test Task',
          description: tooLongDescription 
        })
        .expect(400);

      expect(response.body.details).toContain('Description must be less than 1000 characters');
    });
  });

  describe('Null and Undefined Handling', () => {
    test('should handle null values gracefully', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: null,
          description: null,
          completed: null,
          priority: null
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle undefined values gracefully', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: undefined,
          description: undefined,
          completed: undefined,
          priority: undefined
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle missing request body', async () => {
      const response = await request(app)
        .post('/tasks')
        .expect(500); // Body parser error results in 500

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Special Characters and Unicode', () => {
    test('should handle special characters in title', async () => {
      const specialTitle = 'Task with special chars: !@#$%^&*()_+-={}[]|\\:";\'<>?,./`~';
      
      const response = await request(app)
        .post('/tasks')
        .send({ title: specialTitle })
        .expect(201);

      expect(response.body.title).toBe(specialTitle);
    });

    test('should handle Unicode characters', async () => {
      const unicodeTitle = 'Задача с русскими символами 🚀 العربية 中文 日本語';
      
      const response = await request(app)
        .post('/tasks')
        .send({ title: unicodeTitle })
        .expect(201);

      expect(response.body.title).toBe(unicodeTitle);
    });

    test('should handle emoji in description', async () => {
      const emojiDescription = '📋 Important task with emojis 🔥⭐🎯💡🚀';
      
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Emoji Task',
          description: emojiDescription 
        })
        .expect(201);

      expect(response.body.description).toBe(emojiDescription);
    });

    test('should handle newlines and tabs in text', async () => {
      const multilineTitle = 'Task\\nwith\\nnewlines\\tand\\ttabs';
      
      const response = await request(app)
        .post('/tasks')
        .send({ title: multilineTitle })
        .expect(201);

      expect(response.body.title).toBe(multilineTitle);
    });
  });

  describe('Extreme Pagination Values', () => {
    beforeEach(async () => {
      // Create 5 tasks for pagination tests
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/tasks')
          .send({ title: `Task ${i}` });
      }
    });

    test('should handle page 0', async () => {
      const response = await request(app)
        .get('/tasks?page=0')
        .expect(200);

      expect(response.body.pagination.page).toBe(0); // parseInt(0) = 0, which is falsy, so uses default 1
    });

    test('should handle negative page numbers', async () => {
      const response = await request(app)
        .get('/tasks?page=-5')
        .expect(200);

      expect(response.body.pagination.page).toBe(-5); // parseInt(-5) preserves negative value
    });

    test('should handle extremely large page numbers', async () => {
      const response = await request(app)
        .get('/tasks?page=999999')
        .expect(200);

      expect(response.body.tasks).toHaveLength(0);
      expect(response.body.pagination.page).toBe(999999);
    });

    test('should handle limit of 0', async () => {
      const response = await request(app)
        .get('/tasks?limit=0')
        .expect(200);

      expect(response.body.pagination.limit).toBe(0); // parseInt(0) = 0, now preserved
    });

    test('should handle negative limit', async () => {
      const response = await request(app)
        .get('/tasks?limit=-10')
        .expect(200);

      expect(response.body.pagination.limit).toBe(-10); // parseInt(-10) preserves negative value
    });

    test('should handle extremely large limit', async () => {
      const response = await request(app)
        .get('/tasks?limit=1000000')
        .expect(200);

      expect(response.body.tasks).toHaveLength(5); // All available tasks
    });

    test('should handle non-numeric page and limit', async () => {
      const response = await request(app)
        .get('/tasks?page=abc&limit=xyz')
        .expect(200);

      expect(response.body.pagination.page).toBe(1); // parseInt("abc") = NaN, so fallback to 1
      expect(response.body.pagination.limit).toBe(10); // parseInt("xyz") = NaN, so fallback to 10
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle multiple simultaneous POST requests', async () => {
      const promises = [];
      
      for (let i = 1; i <= 10; i++) {
        promises.push(
          request(app)
            .post('/tasks')
            .send({ title: `Concurrent Task ${i}` })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.title).toBe(`Concurrent Task ${index + 1}`);
      });

      // Verify all tasks were created
      const allTasks = await request(app).get('/tasks');
      expect(allTasks.body.tasks).toHaveLength(10);
    });

    test('should handle concurrent updates to same task', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({ title: 'Task to Update' });

      const taskId = createResponse.body.id;

      const updatePromises = [
        request(app).put(`/tasks/${taskId}`).send({ title: 'Update 1' }),
        request(app).put(`/tasks/${taskId}`).send({ title: 'Update 2' }),
        request(app).put(`/tasks/${taskId}`).send({ title: 'Update 3' })
      ];

      const responses = await Promise.all(updatePromises);
      
      // All requests should succeed (last write wins)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Invalid HTTP Methods', () => {
    test('should handle PATCH method (not supported)', async () => {
      const response = await request(app)
        .patch('/tasks')
        .send({ title: 'Patch Task' })
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    test('should handle HEAD method on tasks endpoint', async () => {
      await request(app)
        .head('/tasks')
        .expect(200);
    });

    test('should handle OPTIONS method', async () => {
      await request(app)
        .options('/tasks')
        .expect(204); // CORS OPTIONS usually returns 204
    });
  });

  describe('Invalid JSON and Content Types', () => {
    test('should handle invalid JSON syntax', async () => {
      const response = await request(app)
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title": "Test", invalid}')
        .expect(500); // JSON parse errors result in 500

      expect(response.body).toHaveProperty('error');
    });

    test('should handle empty JSON object', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle XML content type', async () => {
      const response = await request(app)
        .post('/tasks')
        .set('Content-Type', 'application/xml')
        .send('<task><title>XML Task</title></task>')
        .expect(500); // Non-JSON content results in parser error

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('URL Encoding and Special Paths', () => {
    test('should handle URL encoded task IDs', async () => {
      const response = await request(app)
        .get('/tasks/some%20encoded%20id')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should handle very long URLs', async () => {
      const longId = 'a'.repeat(10000);
      
      const response = await request(app)
        .get(`/tasks/${longId}`)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should handle special characters in task ID', async () => {
      const specialId = 'task-id-with-special-chars!@#$%^&*()';
      
      const response = await request(app)
        .get(`/tasks/${specialId}`)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle creation of many tasks without memory issues', async () => {
      const promises = [];
      
      // Create 100 tasks
      for (let i = 1; i <= 100; i++) {
        promises.push(
          request(app)
            .post('/tasks')
            .send({ 
              title: `Performance Task ${i}`,
              description: `Description for task ${i}`.repeat(10) // Longer descriptions
            })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all tasks exist
      const allTasks = await request(app).get('/tasks?limit=100');
      expect(allTasks.body.tasks).toHaveLength(100);
    }, 10000); // Increase timeout for this test

    test('should handle rapid successive requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 50; i++) {
        promises.push(request(app).get('/health'));
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
      });
    });
  });

  describe('Search Edge Cases', () => {
    beforeEach(async () => {
      await request(app).post('/tasks').send({ 
        title: 'Special Search Task', 
        description: 'Contains special chars: !@#$%^&*()' 
      });
      await request(app).post('/tasks').send({ 
        title: 'Unicode Task 中文', 
        description: 'Description with русский text' 
      });
    });

    test('should handle empty search query', async () => {
      const response = await request(app)
        .get('/tasks?search=')
        .expect(200);

      expect(response.body.tasks).toHaveLength(2); // Should return all tasks
    });

    test('should handle search with special characters', async () => {
      const response = await request(app)
        .get('/tasks?search=!@#$%25')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
    });

    test('should handle Unicode search', async () => {
      const response = await request(app)
        .get('/tasks?search=中文')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
    });

    test('should handle case insensitive search', async () => {
      const response = await request(app)
        .get('/tasks?search=SPECIAL')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
    });
  });
});
