import 'dotenv/config';
import { Hono } from 'hono';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import tasksRoute from './routes/tasks.js';
import generateTasksRoute from './routes/generateTasks.js';
import { serve } from '@hono/node-server';

import {
  createTaskRoute,
  getTasksRoute,
  toggleCompleteRoute,
  deleteTaskRoute,
  generateTasksRoute as generateTasksSwaggerRoute,
} from './docs/swagger';

const app = new Hono();
const openApp = new OpenAPIHono();

const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

openApp.use('*', cors({ origin: FRONTEND_URL }));

openApp.route('/tasks', tasksRoute);
openApp.route('/generateTasks', generateTasksRoute);

openApp.doc('/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Gemini Task API',
    version: '1.0.0',
  },
  tags: [{ name: 'tasks', description: 'Task related endpoints' }],
});

app.get('/', (c) => {
  return c.text('Gemini Task API is running. Visit /docs for Swagger UI.');
});

app.route('/', openApp);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  }
);
