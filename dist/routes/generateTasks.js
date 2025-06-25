import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { config } from "dotenv";
config();
const app = new OpenAPIHono();
const GenerateTasksSchema = z.object({
    topic: z.string().min(1, "Topic is required"),
});
const GenerateTasksResponse = z.object({
    tasks: z.array(z.string()),
});
app.openapi({
    method: "post",
    path: "/",
    summary: "Generate tasks from a topic using Gemini",
    tags: ["tasks"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: GenerateTasksSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Generated tasks",
            content: {
                "application/json": {
                    schema: GenerateTasksResponse,
                },
            },
        },
        400: {
            description: "Bad Request",
        },
    },
}, async (c) => {
    const body = await c.req.json();
    const parsed = GenerateTasksSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: parsed.error.errors[0].message }, 400);
    }
    const { topic } = parsed.data;
    try {
        const prompt = `List 5 short, helpful tasks for someone learning "${topic}". Respond only with bullet points and no explanations.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        });
        // ✅ Step 1: Log full JSON response
        const json = await response.json();
        console.log("🌐 Gemini Full JSON Response:\n", JSON.stringify(json, null, 2));
        // ✅ Step 2: Extract text safely
        let rawText = "";
        try {
            rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        catch (e) {
            console.warn("⚠️ Couldn't parse Gemini response text:", e);
        }
        console.log("🧠 Gemini Response Text:\n", rawText);
        // ✅ Step 3: Clean and extract tasks
        const tasks = rawText
            .split("\n")
            .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
            .filter((line) => line.length > 0 && line.length < 150);
        if (!tasks.length) {
            return c.json({ error: "Gemini did not return valid tasks." }, 400);
        }
        return c.json({ tasks });
    }
    catch (err) {
        console.error("Gemini fetch error:", err);
        return c.json({ error: "Failed to generate tasks with Gemini." }, 500);
    }
});
export default app;
