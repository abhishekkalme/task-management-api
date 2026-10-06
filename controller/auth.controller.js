const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const {
  registerSchema,
  loginSchema,
} = require("../validation/auth.validation");

const register = async (req, res, next) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid input",
      error: validation.error.issues,
    });
  }

  const { username, email, password } = validation.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO users (username,email,password)
    VALUES(?, ?, ?)
    `;

  const values = [username, email, hashedPassword];

  try {
    const [result] = await db.query(sql, values);
    res.status(201).json({
      Message: "User Created",
      id: result.insertId,
      created_at: result,
    });
  } catch (error) {
    next(error)
  }
};

const login = async (req, res, next) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid input",
      error: validation.error.issues,
    });
  }
  const { email, password } = validation.data;

  const findEmail = `
  SELECT * FROM users
  WHERE email = ?;
  `;

  try {
    const [result] = await db.execute(findEmail, [email]);
    if (result.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  register,
  login,
};
