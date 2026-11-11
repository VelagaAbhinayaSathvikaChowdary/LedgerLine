const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
if (process.env.NODE_ENV !== "test") {
    require("dotenv").config();
}
const transactionRoutes = require("./routes/transactionRoutes");
const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");
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

// Transaction APIs
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);

module.exports = app;