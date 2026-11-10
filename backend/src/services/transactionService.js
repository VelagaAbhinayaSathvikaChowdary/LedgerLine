const pool = require("../config/db");

async function withdrawMoney({
    accountId,
    userId,
    amount,
    idempotencyKey
}) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // 1. Check whether this request was already processed
        const existingTransaction = await client.query(
            `SELECT id, status
             FROM transactions
             WHERE initiated_by = $1
             AND idempotency_key = $2`,
            [userId, idempotencyKey]
        );

        if (existingTransaction.rows.length > 0) {
            throw new Error("Duplicate request detected");
        }
        // 2. Lock the account row
        const accountResult = await client.query(
            `SELECT id, user_id, balance, status
             FROM accounts
             WHERE id = $1
             FOR UPDATE`,
            [accountId]
        );

        if (accountResult.rows.length === 0) {
            throw new Error("Account not found");
        }

        const account = accountResult.rows[0];
        // 3. Verify account ownership
        if (Number(account.user_id) !== Number(userId)) {
            throw new Error("Unauthorized account access");
        }
        // 4. Check account status
        if (account.status !== "ACTIVE") {
            throw new Error("Account is blocked");
        }
        // 5. Validate withdrawal amount
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Invalid withdrawal amount");
        }
        // 6. Check available balance
        if (Number(account.balance) < amount) {
            throw new Error("Insufficient balance");
        }
        // 7. Deduct money from account
        await client.query(
            `UPDATE accounts
             SET balance = balance - $1
             WHERE id = $2`,
            [amount, accountId]
        );
        // 8. Create transaction record
        const transactionResult = await client.query(
            `INSERT INTO transactions
             (type, amount, status, idempotency_key,
              initiated_by, from_account_id)
             VALUES ('WITHDRAWAL', $1, 'SUCCESS', $2, $3, $4)
             RETURNING id`,
            [amount, idempotencyKey, userId, accountId]
        );

        const transactionId = transactionResult.rows[0].id;
        // 9. Create debit ledger entry
        await client.query(
            `INSERT INTO ledger_entries
             (transaction_id, account_id, entry_type, amount)
             VALUES ($1, $2, 'DEBIT', $3)`,
            [transactionId, accountId, amount]
        );
        // 10. Commit the complete transaction
        await client.query("COMMIT");
        return {
            message: "Withdrawal successful",
            transactionId,
            amount,
            remainingBalance: Number(account.balance) - amount
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

async function depositMoney({
    accountId,
    userId,
    amount,
    idempotencyKey
}) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Validate amount
        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            Math.round(amount * 100) !== amount * 100
        ) {
            throw new Error("Invalid deposit amount");
        }

        // Create transaction record.
        // The database's unique constraint prevents duplicate requests.
        const transactionResult = await client.query(
            `INSERT INTO transactions
             (type, amount, status, idempotency_key,
              initiated_by, to_account_id)
             VALUES ('DEPOSIT', $1, 'SUCCESS', $2, $3, $4)
             RETURNING id`,
            [amount, idempotencyKey, userId, accountId]
        );

        const transactionId = transactionResult.rows[0].id;

        // Lock the destination account
        const accountResult = await client.query(
            `SELECT id, balance, status
             FROM accounts
             WHERE id = $1
             FOR UPDATE`,
            [accountId]
        );

        if (accountResult.rows.length === 0) {
            throw new Error("Account not found");
        }

        const account = accountResult.rows[0];

        if (account.status !== "ACTIVE") {
            throw new Error("Account is blocked");
        }

        // Increase account balance
        const updatedAccount = await client.query(
            `UPDATE accounts
             SET balance = balance + $1
             WHERE id = $2
             RETURNING balance`,
            [amount, accountId]
        );

        // Create CREDIT ledger entry
        await client.query(
            `INSERT INTO ledger_entries
             (transaction_id, account_id, entry_type, amount)
             VALUES ($1, $2, 'CREDIT', $3)`,
            [transactionId, accountId, amount]
        );

        await client.query("COMMIT");

        return {
            message: "Deposit successful",
            transactionId,
            amount,
            remainingBalance: Number(updatedAccount.rows[0].balance)
        };

    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            throw new Error("Duplicate request detected");
        }

        throw error;

    } finally {
        client.release();
    }
}

async function transferMoney({
    fromAccountId,
    toAccountId,
    userId,
    amount,
    idempotencyKey
}) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Validate transfer details
        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            Math.round(amount * 100) !== amount * 100
        ) {
            throw new Error("Invalid transfer amount");
        }

        if (Number(fromAccountId) === Number(toAccountId)) {
            throw new Error("Cannot transfer to the same account");
        }

        // 2. Check duplicate request
        const existing = await client.query(
            `SELECT id FROM transactions
             WHERE initiated_by = $1
             AND idempotency_key = $2`,
            [userId, idempotencyKey]
        );

        if (existing.rows.length > 0) {
            throw new Error("Duplicate request detected");
        }

        // 3. Lock both accounts in consistent ID order
        const accountIds = [
            Number(fromAccountId),
            Number(toAccountId)
        ].sort((a, b) => a - b);

        const accountsResult = await client.query(
            `SELECT id, user_id, balance, status
             FROM accounts
             WHERE id = ANY($1::bigint[])
             ORDER BY id
             FOR UPDATE`,
            [accountIds]
        );

        if (accountsResult.rows.length !== 2) {
            throw new Error("One or both accounts not found");
        }

        const sender = accountsResult.rows.find(
            account => Number(account.id) === Number(fromAccountId)
        );

        const receiver = accountsResult.rows.find(
            account => Number(account.id) === Number(toAccountId)
        );

        // 4. Verify sender ownership
        if (Number(sender.user_id) !== Number(userId)) {
            throw new Error("Unauthorized sender account");
        }

        // 5. Check account status
        if (
            sender.status !== "ACTIVE" ||
            receiver.status !== "ACTIVE"
        ) {
            throw new Error("One or both accounts are blocked");
        }

        // 6. Check sender balance
        if (Number(sender.balance) < amount) {
            throw new Error("Insufficient balance");
        }

        // 7. Create transaction record
        const transactionResult = await client.query(
            `INSERT INTO transactions
             (type, amount, status, idempotency_key,
              initiated_by, from_account_id, to_account_id)
             VALUES ('TRANSFER', $1, 'SUCCESS', $2, $3, $4, $5)
             RETURNING id`,
            [
                amount,
                idempotencyKey,
                userId,
                fromAccountId,
                toAccountId
            ]
        );

        const transactionId = transactionResult.rows[0].id;

        // 8. Debit sender
        await client.query(
            `UPDATE accounts
             SET balance = balance - $1
             WHERE id = $2`,
            [amount, fromAccountId]
        );

        // 9. Credit receiver
        await client.query(
            `UPDATE accounts
             SET balance = balance + $1
             WHERE id = $2`,
            [amount, toAccountId]
        );

        // 10. Create DEBIT ledger entry
        await client.query(
            `INSERT INTO ledger_entries
             (transaction_id, account_id, entry_type, amount)
             VALUES ($1, $2, 'DEBIT', $3)`,
            [transactionId, fromAccountId, amount]
        );

        // 11. Create CREDIT ledger entry
        await client.query(
            `INSERT INTO ledger_entries
             (transaction_id, account_id, entry_type, amount)
             VALUES ($1, $2, 'CREDIT', $3)`,
            [transactionId, toAccountId, amount]
        );

        // 12. Commit everything together
        await client.query("COMMIT");

        return {
            message: "Transfer successful",
            transactionId,
            amount,
            senderBalance: Number(sender.balance) - amount,
            receiverBalance: Number(receiver.balance) + amount
        };

    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            throw new Error("Duplicate request detected");
        }

        throw error;

    } finally {
        client.release();
    }
}
module.exports = {
    withdrawMoney,
    depositMoney,
    transferMoney
};


