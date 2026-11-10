
const { depositMoney } = require("../services/transactionService");

async function deposit(req, res) {
    try {
        const { accountId, amount, idempotencyKey } = req.body;

        const userId = req.user.id;

        if (!accountId || !idempotencyKey) {
            return res.status(400).json({
                success: false,
                message: "Account ID and idempotency key are required"
            });
        }

        const result = await depositMoney({
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
        console.error("Deposit error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { deposit };
