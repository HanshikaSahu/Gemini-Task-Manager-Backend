import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { db } from "../db.js";
import { tasks } from "../schema.js";
import { eq } from "drizzle-orm";
console.log("✅ tasks.ts loaded");
const app = new OpenAPIHono();
// Schemas
const TaskInput = z.object({
    title: z.string().min(1),
    userId: z.string().min(1),
    dueDate: z.string().optional(),
    category: z.string().optional(),
});
const TaskSchema = z.object({
    id: z.number(),
    title: z.string(),
    userId: z.string(),
    completed: z.boolean().nullable(),
    dueDate: z.string().nullable(),
    category: z.string().nullable(),
});
const ErrorSchema = z.object({
    error: z.string(),
});
// 🔹 Create Task
app.openapi({
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
}, async (c) => {
    const body = TaskInput.parse(await c.req.json());
    const result = await db.insert(tasks).values(body).returning();
    return c.json(result[0], 200);
});
// 🔹 Get All Tasks
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
            description: "List of tasks",
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
        .select({
        id: tasks.id,
        title: tasks.title,
        completed: tasks.completed,
        dueDate: tasks.dueDate,
        userId: tasks.userId,
        category: tasks.category,
    })
        .from(tasks)
        .where(eq(tasks.userId, userId));
    return c.json(allTasks, 200);
});
// 🔹 Toggle Completion
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
        404: {
            description: "Task not found",
            content: {
                "application/json": {
                    schema: ErrorSchema,
                },
            },
        },
    },
}, async (c) => {
    const id = c.req.param("id");
    const existing = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
    if (!existing.length) {
        return c.json({ error: "Task not found" }, 404);
    }
    const updated = await db
        .update(tasks)
        .set({ completed: !existing[0].completed })
        .where(eq(tasks.id, Number(id)))
        .returning();
    return c.json(updated[0], 200);
});
// 🔹 General Update
app.openapi({
    method: "patch",
    path: "/{id}",
    summary: "Update task details",
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
                        dueDate: z.string().nullable().optional(),
                        category: z.string().nullable().optional(),
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
        404: {
            description: "Task not found",
            content: {
                "application/json": {
                    schema: ErrorSchema,
                },
            },
        },
    },
}, async (c) => {
    const id = c.req.param("id");
    const data = await c.req.json();
    const existing = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
    if (!existing.length) {
        return c.json({ error: "Task not found" }, 404);
    }
    const updated = await db
        .update(tasks)
        .set(data)
        .where(eq(tasks.id, Number(id)))
        .returning();
    return c.json(updated[0], 200);
});
// 🔹 Delete Task
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
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
}, async (c) => {
    const id = c.req.param("id");
    await db.delete(tasks).where(eq(tasks.id, Number(id)));
    return c.json({ message: "Deleted successfully" }, 200);
});
export default app;
