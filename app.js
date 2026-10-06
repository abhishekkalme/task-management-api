const express = require("express");
const app = express();
const taskRoutes = require('./routes/task.routes')
const authRoutes = require('./routes/auth.routes')
const errorMiddleware = require("./middleware/error.middleware")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: "Too many requests, please try again later"
})

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(limiter);

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);


app.use(errorMiddleware)
module.exports = app