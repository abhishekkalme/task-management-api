const express = require("express");

const {
  getTasks,
  getTasksById,
  createTask,
  updateTask,
  deleteTask,
  test,
} = require("../controller/task.controller");

const authMiddleware = require("../middleware/auth.middleware");
const { testTransaction } = require("../controller/transaction.controller");

const router = express.Router();
router.get("/test-error", test);

router.get("/test-transaction", authMiddleware, testTransaction);
router.get("/", authMiddleware, getTasks);
router.get("/:id", authMiddleware, getTasksById);
router.post("/", authMiddleware, createTask);
router.put("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);

module.exports = router;
