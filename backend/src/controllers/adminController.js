
const pool = require("../config/db");

async function getPendingUsers(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, name, email, created_at
             FROM users
             WHERE role = 'HOLDER'
             AND status = 'PENDING'
             ORDER BY created_at ASC`
        );

        return res.status(200).json({
            success: true,
            users: result.rows
        });

    } catch (error) {
        console.error("Pending users error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch pending users"
        });
    }
}

async function approveUser(req, res) {
    const client = await pool.connect();

    try {
        const userId = req.params.userId;

        await client.query("BEGIN");

        const result = await client.query(
            `SELECT id, status
             FROM users
             WHERE id = $1 AND role = 'HOLDER'
             FOR UPDATE`,
            [userId]
        );

        if (result.rows.length === 0 ||
            result.rows[0].status !== "PENDING") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "User not found or not pending approval"
            });
        }

        const accountNumber = `TEST${userId}00001`;

        await client.query(
            `INSERT INTO accounts
             (user_id, account_number, balance, status)
             VALUES ($1, $2, 0, 'ACTIVE')`,
            [userId, accountNumber]
        );

        await client.query(
            `UPDATE users
             SET status = 'APPROVED'
             WHERE id = $1`,
            [userId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "User approved and account created",
            accountNumber
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Approval error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to approve user"
        });

    } finally {
        client.release();
    }
}

async function rejectUser(req, res) {
    try {
        const result = await pool.query(
            `UPDATE users
             SET status = 'REJECTED'
             WHERE id = $1
             AND role = 'HOLDER'
             AND status = 'PENDING'
             RETURNING id`,
            [req.params.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pending user not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Registration rejected"
        });

    } catch (error) {
        console.error("Rejection error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to reject user"
        });
    }
}

module.exports = {
    getPendingUsers,
    approveUser,
    rejectUser
};
