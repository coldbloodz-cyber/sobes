const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// In-memory storage for tasks
let tasks = [];

// Validation functions
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

const findTaskById = (id) => {
  return tasks.find(task => task.id === id);
};

const createTask = (taskData) => {
  const task = {
    id: uuidv4(),
    title: taskData.title.trim(),
    description: taskData.description || '',
    completed: taskData.completed || false,
    priority: taskData.priority || 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tasks.push(task);
  return task;
};

const updateTask = (id, updateData) => {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return null;
  }
  
  const updatedTask = {
    ...tasks[taskIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  tasks[taskIndex] = updatedTask;
  return updatedTask;
};

const deleteTask = (id) => {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return false;
  }
  
  tasks.splice(taskIndex, 1);
  return true;
};

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// GET /tasks - Get all tasks with optional filtering and pagination
app.get('/tasks', (req, res) => {
  try {
    let filteredTasks = [...tasks];
    
    // Filter by completion status
    if (req.query.completed !== undefined) {
      const completed = req.query.completed === 'true';
      filteredTasks = filteredTasks.filter(task => task.completed === completed);
    }
    
    // Filter by priority
    if (req.query.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === req.query.priority);
    }
    
    // Search in title and description
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    
    filteredTasks.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
      if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
      return 0;
    });
    
    // Pagination - preserve original values, handle NaN gracefully, allow 0
    const pageParam = parseInt(req.query.page);
    const limitParam = parseInt(req.query.limit);
    const page = (req.query.page !== undefined && !isNaN(pageParam)) ? pageParam : 1;
    const limit = (req.query.limit !== undefined && !isNaN(limitParam)) ? limitParam : 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    res.json({
      tasks: paginatedTasks,
      pagination: {
        page,
        limit,
        total: filteredTasks.length,
        totalPages: Math.ceil(filteredTasks.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /tasks/:id - Get specific task
app.get('/tasks/:id', (req, res) => {
  try {
    const task = findTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /tasks - Create new task
app.post('/tasks', (req, res) => {
  try {
    const validationErrors = validateTask(req.body);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const task = createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /tasks/:id - Update task
app.put('/tasks/:id', (req, res) => {
  try {
    const task = findTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const validationErrors = validateTask({ ...task, ...req.body });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const updatedTask = updateTask(req.params.id, req.body);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /tasks/:id - Delete task
app.delete('/tasks/:id', (req, res) => {
  try {
    const deleted = deleteTask(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /tasks - Delete all tasks
app.delete('/tasks', (req, res) => {
  try {
    tasks = [];
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
