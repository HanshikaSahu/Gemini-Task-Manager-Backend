import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { db } from "../db";
import { tasks } from "../schema";
import { eq } from "drizzle-orm";

console.log("✅ tasks.ts loaded");

const app = new OpenAPIHono();

app.onError((err, c) => {
  console.error("❌ Unhandled Error:", err.stack || err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});



const TaskInput = z.object({
  title: z.string().min(1),
  userId: z.string().min(1),
  dueDate: z.string().optional(),
});

const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  userId: z.string(),
  completed: z.boolean(),
  dueDate: z.string().nullable(),
});

// 📌 Create Task
app.openapi(
  {
    method: "post",
    path: "/",
    summary: "Create task",
    request: {
      body: {
        content: {
          "application/json": {
            schema: TaskInput,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Task created",
        content: {
          "application/json": {
            schema: TaskSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const body = await c.req.json();
    console.log("📥 Incoming task POST payload:", body);

    const result = await db
      .insert(tasks)
      .values({ ...body })
      .returning();

    return c.json(result[0]);
  }
);


// 📌 Get All Tasks for User
app.openapi({
  method: "get",
  path: "/",
  summary: "Get all tasks for a user",
  request: {
    query: z.object({
      userId: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: "User's tasks",
      content: {
        "application/json": {
          schema: z.array(TaskSchema),
        },
      },
    },
  },
}, async (c) => {
  const { userId } = c.req.valid("query");
  const allTasks = await db
  .select({ id: tasks.id, title: tasks.title, completed: tasks.completed, dueDate: tasks.dueDate, userId: tasks.userId }) // no category
  .from(tasks)
  .where(eq(tasks.userId, userId));
  return c.json(allTasks);
});

// 📌 Toggle Completion
app.openapi({
  method: "patch",
  path: "/{id}/complete",
  summary: "Toggle task complete",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Task updated",
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
    },
  },
}, async (c) => {
  const { id } = c.req.param();
  const existing = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  if (!existing.length) return c.json({ error: "Task not found" }, 404);

  const updated = await db.update(tasks)
    .set({ completed: !existing[0].completed })
    .where(eq(tasks.id, Number(id)))
    .returning();

  return c.json(updated[0]);
});
 
// 📌 General Update Task (title and/or completed)
app.openapi({
  method: "patch",
  path: "/{id}",
  summary: "Update task title, completed status, or due date",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional(),
            completed: z.boolean().optional(),
            dueDate: z.string().nullable().optional(), // ✅ added support for dueDate
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Task updated",
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
    },
  },
}, async (c) => {
  const { id } = c.req.param();
  const data = await c.req.json();

  const existing = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  if (!existing.length) return c.json({ error: "Task not found" }, 404);

  const updated = await db.update(tasks)
    .set(data)
    .where(eq(tasks.id, Number(id)))
    .returning();

  return c.json(updated[0]);
}); 


// 📌 Delete Task
app.openapi({
  method: "delete",
  path: "/{id}",
  summary: "Delete task",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Task deleted",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
}, async (c) => {
  const { id } = c.req.param();
  await db.delete(tasks).where(eq(tasks.id, Number(id)));
  return c.json({ message: "Deleted successfully" });
});

export default app;
