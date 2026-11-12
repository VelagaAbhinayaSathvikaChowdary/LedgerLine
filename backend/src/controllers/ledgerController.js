
const pool = require("../config/db");

const getLedgerEntries = async (req, res) => {
    try {
        let result;

        if (req.user.role === "ADMIN") {
            result = await pool.query(
                `SELECT 
                    le.id,
                    le.transaction_id,
                    le.account_id,
                    a.account_number,
                    le.entry_type,
                    le.amount,
                    le.created_at
                 FROM ledger_entries le
                 JOIN accounts a ON le.account_id = a.id
                 ORDER BY le.created_at DESC`
            );
        } else {
            result = await pool.query(
                `SELECT 
                    le.id,
                    le.transaction_id,
                    le.account_id,
                    a.account_number,
                    le.entry_type,
                    le.amount,
                    le.created_at
                 FROM ledger_entries le
                 JOIN accounts a ON le.account_id = a.id
                 WHERE a.user_id = $1
                 ORDER BY le.created_at DESC`,
                [req.user.id]
            );
        }

        res.status(200).json({
            success: true,
            entries: result.rows
        });

    } catch (error) {
        console.error("Fetch ledger error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch ledger entries"
        });
    }
};

module.exports = { getLedgerEntries };
