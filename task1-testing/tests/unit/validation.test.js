const app = require('../../src/app');

// Extracting validation function for unit testing
// In a real app, this would be in a separate utility module
const validateTask = (task) => {
  const errors = [];
  
  if (!task.title || typeof task.title !== 'string' || task.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }
  
  if (task.title && task.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (task.description && typeof task.description !== 'string') {
    errors.push('Description must be a string');
  }
  
  if (task.description && task.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }
  
  if (task.completed !== undefined && typeof task.completed !== 'boolean') {
    errors.push('Completed must be a boolean');
  }
  
  if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }
  
  return errors;
};

describe('Task Validation Unit Tests', () => {
  describe('validateTask function', () => {
    test('should pass validation for valid task', () => {
      const validTask = {
        title: 'Test Task',
        description: 'Test description',
        completed: false,
        priority: 'medium'
      };
      
      const errors = validateTask(validTask);
      expect(errors).toHaveLength(0);
    });

    test('should require title', () => {
      const invalidTask = {
        description: 'Test description'
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Title is required and must be a non-empty string');
    });

    test('should reject empty title', () => {
      const invalidTask = {
        title: '   ',
        description: 'Test description'
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Title is required and must be a non-empty string');
    });

    test('should reject non-string title', () => {
      const invalidTask = {
        title: 123,
        description: 'Test description'
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Title is required and must be a non-empty string');
    });

    test('should reject title longer than 200 characters', () => {
      const invalidTask = {
        title: 'a'.repeat(201),
        description: 'Test description'
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Title must be less than 200 characters');
    });

    test('should accept valid title length', () => {
      const validTask = {
        title: 'a'.repeat(200),
        description: 'Test description'
      };
      
      const errors = validateTask(validTask);
      expect(errors).not.toContain('Title must be less than 200 characters');
    });

    test('should reject non-string description', () => {
      const invalidTask = {
        title: 'Test Task',
        description: 123
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Description must be a string');
    });

    test('should reject description longer than 1000 characters', () => {
      const invalidTask = {
        title: 'Test Task',
        description: 'a'.repeat(1001)
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Description must be less than 1000 characters');
    });

    test('should accept valid description length', () => {
      const validTask = {
        title: 'Test Task',
        description: 'a'.repeat(1000)
      };
      
      const errors = validateTask(validTask);
      expect(errors).not.toContain('Description must be less than 1000 characters');
    });

    test('should allow empty description', () => {
      const validTask = {
        title: 'Test Task'
      };
      
      const errors = validateTask(validTask);
      expect(errors).not.toContain('Description must be a string');
    });

    test('should reject non-boolean completed', () => {
      const invalidTask = {
        title: 'Test Task',
        completed: 'true'
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Completed must be a boolean');
    });

    test('should accept boolean completed values', () => {
      const validTask1 = {
        title: 'Test Task',
        completed: true
      };
      
      const validTask2 = {
        title: 'Test Task',
        completed: false
      };
      
      expect(validateTask(validTask1)).not.toContain('Completed must be a boolean');
      expect(validateTask(validTask2)).not.toContain('Completed must be a boolean');
    });

    test('should reject invalid priority values', () => {
      const invalidTask = {
        title: 'Test Task',
        priority: 'urgent'
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toContain('Priority must be one of: low, medium, high');
    });

    test('should accept valid priority values', () => {
      const validPriorities = ['low', 'medium', 'high'];
      
      validPriorities.forEach(priority => {
        const validTask = {
          title: 'Test Task',
          priority
        };
        
        const errors = validateTask(validTask);
        expect(errors).not.toContain('Priority must be one of: low, medium, high');
      });
    });

    test('should return multiple errors for multiple validation failures', () => {
      const invalidTask = {
        title: '',
        description: 123,
        completed: 'false',
        priority: 'urgent'
      };
      
      const errors = validateTask(invalidTask);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('Title is required and must be a non-empty string');
      expect(errors).toContain('Description must be a string');
      expect(errors).toContain('Completed must be a boolean');
      expect(errors).toContain('Priority must be one of: low, medium, high');
    });
  });
});
