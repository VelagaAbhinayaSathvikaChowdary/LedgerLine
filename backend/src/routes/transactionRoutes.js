const express = require("express");
const { getLedgerEntries } = require("../controllers/ledgerController");
const { withdraw } = require("../controllers/transactionController");
const { deposit } = require("../controllers/depositController");
const { transfer } = require("../controllers/transferController");
const { authenticateToken } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const router = express.Router();
router.post("/withdraw", authenticateToken, withdraw);
router.post(
    "/deposit",
    authenticateToken,
    authorizeRoles("ADMIN"),
    deposit
);
router.post("/transfer", authenticateToken, transfer);
router.get("/ledger", authenticateToken, getLedgerEntries);
module.exports = router;
