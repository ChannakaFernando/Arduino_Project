const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const localIp = '192.168.8.110';
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: 'localhost', // MySQL server host
    user: 'root', // MySQL username
    password: '', // MySQL password
    database: 'esp32_data', // MySQL database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection
(async function testDB() {
    try {
        const conn = await pool.getConnection();
        console.log(" MySQL connected successfully!");
        conn.release();
    } catch (err) {
        console.error(" MySQL connection failed:", err);
    }
})();

//  POST endpoint to receive ESP32 data
app.post("/data", async (req, res) => {
    const sensorData = req.body;
    console.log("Received data:", sensorData);

    try {
        await pool.execute(
            `INSERT INTO readings 
            (temperature, humidity, level, rain_status, rainfall, prediction, pressure) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                sensorData.temperature || 0,
                sensorData.humidity || 0,
                sensorData.level || 0,       // ultrasonic distance in cm
                sensorData.rain_status || 0,
                sensorData.rainfall || 0,
                sensorData.prediction || 0,
                sensorData.pressure || 1012
            ]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(" MySQL insert error:", err);
        res.sendStatus(500);
    }
});

//  GET latest record
app.get("/api/sensor-data", async (req, res) => {
    // log the time
    const now = new Date();
    console.log("Fetching latest sensor data at:", now.toISOString());
    
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1'
        );
        const row = rows[0] || {};
        res.json({
            rain_status: row.rain_status || 0,
            rainfall: row.rainfall || 0,
            prediction: row.prediction || 0,
            temperature: row.temperature || 0,
            humidity: row.humidity || 0,
            pressure: row.pressure || 1012,
            level: row.level || 0
        });
    } catch (err) {
        console.error(" MySQL fetch error:", err);
        res.sendStatus(500);
    }
});

//  GET last 50 records (for charts/history)
app.get("/history", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM readings ORDER BY timestamp DESC LIMIT 50'
        );
        res.json(rows.reverse());
    } catch (err) {
        console.error(" MySQL fetch error:", err);
        res.sendStatus(500);
    }
});


app.listen(port,() => {
    console.log(`✅ Server running at ${localIp}:${port}`);
});
   