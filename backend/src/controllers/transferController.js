
const { transferMoney } = require("../services/transactionService");

async function transfer(req, res) {
    try {
        const {
            fromAccountId,
            toAccountId,
            amount,
            idempotencyKey
        } = req.body;

        const userId = req.user.id;

        if (
            !fromAccountId ||
            !toAccountId ||
            !idempotencyKey
        ) {
            return res.status(400).json({
                success: false,
                message: "Required transfer details are missing"
            });
        }

        const result = await transferMoney({
            fromAccountId,
            toAccountId,
            userId,
            amount,
            idempotencyKey
        });

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("Transfer error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { transfer };
