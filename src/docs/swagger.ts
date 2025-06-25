import { createRoute, z } from '@hono/zod-openapi';

const TaskInput = z.object({
  title: z.string(),
  userId: z.string(),
});

const Task = z.object({
  id: z.number(),
  title: z.string(),
  userId: z.string(),
  completed: z.boolean(),
});

// 1. Create Task
export const createTaskRoute = createRoute({
  method: 'post',
  path: '/tasks',
  summary: 'Create a task',
  request: {
    body: {
      content: {
        'application/json': TaskInput,
      },
    },
  },
  responses: {
    200: {
      description: 'Created task',
      content: {
        'application/json': Task,
      },
    },
  },
});

// 2. Get Tasks
export const getTasksRoute = createRoute({
  method: 'get',
  path: '/tasks',
  summary: 'Get tasks',
  request: {
    query: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'List of tasks',
      content: {
        'application/json': z.array(Task),
      },
    },
  },
});

// 3. Toggle Complete
export const toggleCompleteRoute = createRoute({
  method: 'patch',
  path: '/tasks/{id}/complete',
  summary: 'Toggle task complete',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Toggled task',
      content: {
        'application/json': Task,
      },
    },
  },
});

// 4. Delete Task
export const deleteTaskRoute = createRoute({
  method: 'delete',
  path: '/tasks/{id}',
  summary: 'Delete task',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Deleted',
      content: {
        'application/json': z.object({
          message: z.string(),
        }),
      },
    },
  },
});

// 5. Generate via Gemini
export const generateTasksRoute = createRoute({
  method: 'post',
  path: '/generateTasks',
  summary: 'Generate tasks from a topic using Gemini',
  request: {
    body: {
      content: {
        'application/json': z.object({
          topic: z.string().min(1),
        }),
      },
    },
  },
  responses: {
    200: {
      description: 'Generated tasks',
      content: {
        'application/json': z.object({
          tasks: z.array(z.string()),
        }),
      },
    },
  },
});
