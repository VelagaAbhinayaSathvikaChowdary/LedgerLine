
const express = require("express");

const {
    getPendingUsers,
    approveUser,
    rejectUser
} = require("../controllers/adminController");

const { authenticateToken } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.get(
    "/pending-users",
    authenticateToken,
    authorizeRoles("ADMIN"),
    getPendingUsers
);

router.put(
    "/approve/:userId",
    authenticateToken,
    authorizeRoles("ADMIN"),
    approveUser
);

router.put(
    "/reject/:userId",
    authenticateToken,
    authorizeRoles("ADMIN"),
    rejectUser
);

module.exports = router;
