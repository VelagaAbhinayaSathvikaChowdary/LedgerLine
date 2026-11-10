const { withdrawMoney } = require("../services/transactionService");

async function withdraw(req, res) {
    try {
        const { accountId, amount, idempotencyKey } = req.body;

        // User identity comes from the authentication middleware
        const userId = req.user.id;

        const result = await withdrawMoney({
            accountId,
            userId,
            amount,
            idempotencyKey
        });

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("Withdrawal error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { withdraw };
