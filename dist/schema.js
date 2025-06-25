import { pgTable, serial, text, boolean, varchar, date } from "drizzle-orm/pg-core";
export const tasks = pgTable("tasks", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: text("title").notNull(),
    completed: boolean("completed").default(false),
    dueDate: date("due_date"),
    category: varchar("category", { length: 255 }).default("General"),
});
