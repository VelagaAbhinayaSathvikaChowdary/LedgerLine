
const pool = require("../src/config/db");
const { transferMoney } = require("../src/services/transactionService");

describe("LedgerLine Idempotency Tests", () => {
    let userId;
    let senderAccountId;
    let receiverAccountId;

    beforeEach(async () => {
        // Clean only the separate test database.
        await pool.query(`
            TRUNCATE TABLE
                audit_logs,
                ledger_entries,
                transactions,
                accounts,
                users
            RESTART IDENTITY CASCADE
        `);

        // Create a test user.
        const userResult = await pool.query(
            `INSERT INTO users
             (name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                "Test Holder",
                "idempotency@test.com",
                "test-password-hash",
                "HOLDER"
            ]
        );

        userId = userResult.rows[0].id;

        // Create sender account with ₹500.
        const senderResult = await pool.query(
            `INSERT INTO accounts
             (user_id, account_number, balance)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [userId, "IDEM100001", "500.00"]
        );

        senderAccountId = senderResult.rows[0].id;

        // Create receiver account with ₹200.
        const receiverResult = await pool.query(
            `INSERT INTO accounts
             (user_id, account_number, balance)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [userId, "IDEM100002", "200.00"]
        );

        receiverAccountId = receiverResult.rows[0].id;
    });

    test("should not execute the same transfer twice", async () => {
        const transferDetails = {
            fromAccountId: senderAccountId,
            toAccountId: receiverAccountId,
            userId,
            amount: "100.25",
            idempotencyKey: "IDEM-TEST-001"
        };

        const firstRequest = await transferMoney(transferDetails);
        const secondRequest = await transferMoney(transferDetails);

        expect(firstRequest.message).toBe("Transfer successful");

        expect(secondRequest.alreadyProcessed).toBe(true);

        expect(secondRequest.transactionId)
            .toBe(firstRequest.transactionId);

        // Verify actual database balances.
        const balances = await pool.query(
            `SELECT id, balance
             FROM accounts
             WHERE id = ANY($1::bigint[])
             ORDER BY id`,
            [[senderAccountId, receiverAccountId]]
        );

        expect(String(balances.rows[0].balance)).toBe("399.75");
        expect(String(balances.rows[1].balance)).toBe("300.25");

        // Only one transaction should exist.
        const transactionCount = await pool.query(
            `SELECT COUNT(*) AS count
             FROM transactions
             WHERE idempotency_key = $1`,
            ["IDEM-TEST-001"]
        );

        expect(Number(transactionCount.rows[0].count)).toBe(1);
    });

    test("should reject the same key with a different amount", async () => {
        const firstRequest = {
            fromAccountId: senderAccountId,
            toAccountId: receiverAccountId,
            userId,
            amount: "100.25",
            idempotencyKey: "IDEM-TEST-002"
        };

        await transferMoney(firstRequest);

        await expect(
            transferMoney({
                ...firstRequest,
                amount: "150.25"
            })
        ).rejects.toThrow(
            "Idempotency key has already been used for a different request"
        );

        // Confirm that the second request did not move money.
        const balances = await pool.query(
            `SELECT id, balance
             FROM accounts
             WHERE id = ANY($1::bigint[])
             ORDER BY id`,
            [[senderAccountId, receiverAccountId]]
        );

        expect(String(balances.rows[0].balance)).toBe("399.75");
        expect(String(balances.rows[1].balance)).toBe("300.25");
    });
});

afterAll(async () => {
    await pool.end();
});
