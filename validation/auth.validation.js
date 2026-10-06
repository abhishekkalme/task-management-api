const { z, email } = require("zod");

const registerSchema = z.object({
    username: z
    .string()
    .trim()
    .min(3,"Username must be at least 3 character")
    .max(50, "Username cannot exceed 50 character"),

    email: z
    .string()
    .trim()
    .email("Invalid email"),

    password: z
    .string()
    .min(6,"Password must be at least 6 character")
    .max(100, "Username cannot exceed 100 character"),
});

const loginSchema = z.object({
    email: z
    .string()
    .trim()
    .email("Invalid email"),

    password: z
    .string()
    .min(1,"Password is required")

});


module.exports = {
    registerSchema,
    loginSchema
}