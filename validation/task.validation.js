const {z} = require("zod")

const taskSchema = z.object({
    TASK: z
    .string()
    .trim()
    .min(1, "Task is required")
    .max(200, "Task cannot exceed 200 characters"),

    TAGS: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(200, "Maximam 10 tags are allowed"),

    DONE: z
    .boolean()
})

const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, "Limit cannot exceed 100")
    .default(10),
});

const taskFilterSchema = z.object({
    done: z.coerce.boolean().optional(),
    tag: z.string().trim().min(1).optional(),
    search: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

})

const taskSortSchema = z.object({
    sort: z.enum(["TASK","DONE"]).optional(),
    order: z.enum(["asc", "dsc"]).optional().default("asc")
})




module.exports = {taskSchema, pageSchema, taskFilterSchema,taskSortSchema};