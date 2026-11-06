const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to LedgerLine API"
    });
});

module.exports = app;