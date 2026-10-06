const db = require("../config/db");
const redis = require("../config/redis");
const {
  taskSchema,
  pageSchema,
  taskFilterSchema,
  taskSortSchema,
} = require("../validation/task.validation");
const { invalidateUserTasks } = require("../utils/cache");

const getTasks = async (req, res, next) => {
  const userId = req.user.id;

  const validation = pageSchema.safeParse(req.query);
  const filterValidation = taskFilterSchema.safeParse(req.query);
  const sortValidation = taskSortSchema.safeParse(req.query);

  if (!filterValidation.success) {
    return res.status(400).json({
      message: "Invalid filter input",
      error: filterValidation.error.issues,
    });
  }
  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid input",
      error: validation.error.issues,
    });
  }
  if (!sortValidation.success) {
    return res.status(400).json({
      message: "Invalid sorting input",
      error: sortValidation.error.issues,
    });
  }

  const { sort, order } = sortValidation.data;
  const { done, tag, search } = filterValidation.data;
  const { page, limit } = validation.data;
  const cacheParams = {
    page,
    limit,
    done,
    tag,
    search,
    sort,
    order,
  };
  const cacheKey = `tasks:user:${userId}:${JSON.stringify(cacheParams)}`;
  const cachedTasks = await redis.get(cacheKey);
  console.log("Cached Tasks:", cachedTasks);

  if (cachedTasks) {
    const responseData = JSON.parse(cachedTasks);
    return res.status(200).json(responseData);
  }
  
  const offset = (page - 1) * limit;
  const allowedSortColumns = {
    TASK: "TASK",
    DONE: "DONE",
  };
  const sortColumn = allowedSortColumns[sort];
  try {
    let TaskQuery = `SELECT * FROM tasks WHERE user_id = ?`;
    let queryValue = [userId];
    if (done !== undefined) {
      TaskQuery += ` AND DONE = ?`;
      queryValue.push(done);
    }
    if (tag !== undefined) {
      TaskQuery += ` AND JSON_CONTAINS(TAGS, ?)`;
      queryValue.push(JSON.stringify(tag));
    }
    if (search !== undefined) {
      TaskQuery += ` AND TASK LIKE ?`;
      queryValue.push(`%${search}%`);
    }
    if (sortColumn) {
      TaskQuery += ` ORDER BY ${sortColumn} ${order.toUpperCase()}`;
    }

    TaskQuery += ` LIMIT ? OFFSET ?`;
    queryValue.push(limit, offset);
    const countQuery = `SELECT COUNT(*) AS total FROM tasks WHERE user_id = ?`;
    let countValue = [userId];
    if (done !== undefined) {
      countQuery += ` AND DONE = ?`;
      countValue.push(done);
    }
    if (tag !== undefined) {
      countQuery += ` AND JSON_CONTAINS(TAGS, ?)`;
      countValue.push(JSON.stringify(tag));
    }
    if (search !== undefined) {
      countQuery += ` AND TASK LIKE ?`;
      countValue.push(`%${search}%`);
    }
    const [tasks] = await db.query(TaskQuery, queryValue);
    const [countResult] = await db.query(countQuery, countValue);
    const totalTask = countResult[0].total;
    const totalPage = Math.ceil(totalTask / limit);
    const responseData = {
      tasks,
      totalTask,
      totalPage,
    };
    await redis.set(cacheKey, JSON.stringify(responseData), { EX: 60 });

    return res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

const getTasksById = async (req, res, next) => {
  const paramId = parseInt(req.params.id);
  const userId = req.user.id;

  if (isNaN(paramId)) {
    return res.status(400).json({
      Message: "Invalid ID",
    });
  }
  const q = "SELECT * FROM tasks WHERE id = ? AND user_id = ?";

  try {
    const [result] = await db.query(q, [paramId, userId]);
    if (result.length === 0) {
      return res.status(404).json({
        Message: "Task Not Found",
      });
    }

    res.status(200).json({
      Message: "Task Found",
      result: result[0],
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  const validation = taskSchema.safeParse(req.body);
  const userId = req.user.id;

  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid input",
      error: validation.error.issues,
    });
  }

  const { TASK, TAGS, DONE } = validation.data;

  const sql = `
    INSERT INTO tasks (task,tags,done,user_id)
    VALUES(?, ?, ?,?)
    `;

  const values = [TASK, JSON.stringify(TAGS), DONE, userId];

  try {
    const [result] = await db.query(sql, values);
    await invalidateUserTasks(userId);
    res.status(201).json({
      Message: "Task Created",
      id: result.insertId,
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  const updateId = parseInt(req.params.id);
  const userId = req.user.id;

  if (isNaN(updateId)) {
    return res.status(400).json({
      Message: "Invalid ID",
    });
  }
  const { TASK, TAGS, DONE } = req.body;

  if (!TASK) {
    return res.status(400).json({ Message: "Task Not Found" });
  }

  if (!TAGS) {
    return res.status(400).json({ Message: "Tags Not Found" });
  }

  if (DONE === undefined) {
    return res.status(400).json({ Message: "Done Not Found" });
  }

  const q = `
  UPDATE tasks
  SET TASK =?, TAGS = ?, DONE = ?
  WHERE id = ? AND user_id =? 
  `;

  try {
    const [result] = await db.query(q, [
      TASK,
      JSON.stringify(TAGS),
      DONE,
      updateId,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        Message: "Task Not Found",
      });
    }
    await invalidateUserTasks(userId);
    res.status(200).json({
      Message: "Task Updated",
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  const deleteId = parseInt(req.params.id);
  const userId = req.user.id;
  if (isNaN(deleteId)) {
    return res.status(400).json({
      Message: "Invalid ID",
    });
  }

  if (!userId) {
    return res.status(400).json({
      message: "Token not found",
    });
  }
  const q = "DELETE FROM tasks WHERE id = ? AND user_id = ?";

  try {
    const [result] = await db.query(q, [deleteId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        Message: "Task Not Found",
      });
    }
    await invalidateUserTasks(userId);
    res.status(200).json({
      Message: "Task Deleted",
    });
  } catch (error) {
    next(error);
  }
};

const test = async (req, res, next) => {
  const error = new Error("Sonething Went wrong");
  next(error);
};

module.exports = {
  getTasks,
  getTasksById,
  createTask,
  updateTask,
  deleteTask,
  test,
};
