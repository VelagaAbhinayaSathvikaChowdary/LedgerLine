
const pool = require("../config/db");

const getMyAccounts = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, account_number, balance, status
             FROM accounts
             WHERE user_id = $1
             ORDER BY id`,
            [req.user.id]
        );

        res.status(200).json({
            accounts: result.rows
        });
    } catch (error) {
        console.error("Fetch accounts error:", error);
        res.status(500).json({
            message: "Unable to fetch accounts"
        });
    }
};

module.exports = { getMyAccounts };
