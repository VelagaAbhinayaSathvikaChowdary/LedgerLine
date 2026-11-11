const express = require("express");
const { getMyAccounts } = require("../controllers/accountController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my-accounts", authenticateToken, getMyAccounts);

module.exports = router;