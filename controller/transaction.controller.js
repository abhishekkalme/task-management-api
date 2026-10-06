const db = require("../config/db");

const testTransaction = async (req, res, next) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Query 1 — create a task
    await connection.query(
      `
        INSERT INTO tasks (TASK, TAGS, DONE, user_id)
        VALUES (?, ?, ?, ?)
      `,
      ["Transaction Test", JSON.stringify(["test"]), false, req.user.id]
    );

    console.log("Query 1 successful");

    // Query 2 — intentionally wrong column
    await connection.query(
      `
    UPDATE tasks
    SET DONE = ?
    WHERE id = ?
  `,
      [true, 1]
    );

    console.log("Query 2 successful");

    await connection.commit();

    res.status(200).json({
      message: "Transaction committed",
    });
  } catch (error) {
    console.log("Something failed");
    console.log("Rolling back...");

    await connection.rollback();

    next(error);
  } finally {
    connection.release();
  }
};

module.exports = { testTransaction };
