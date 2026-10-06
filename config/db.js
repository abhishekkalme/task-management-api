const mysql = require('mysql2/promise')
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS=== "true",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT)
})

module.exports = pool;


