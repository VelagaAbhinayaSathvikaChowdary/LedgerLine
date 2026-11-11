
const pool = require("../src/config/db");
const { withdrawMoney } = require("../src/services/transactionService");

describe("LedgerLine Concurrency Tests", () => {
    let userId;
    let accountId;

    beforeEach(async () => {
        await pool.query(`
            TRUNCATE TABLE
                audit_logs,
                ledger_entries,
                transactions,
                accounts,
                users
            RESTART IDENTITY CASCADE
        `);

        const user = await pool.query(
            `INSERT INTO users
             (name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            ["Concurrency User", "concurrency@test.com", "test-hash", "HOLDER"]
        );

        userId = user.rows[0].id;

        const account = await pool.query(
            `INSERT INTO accounts
             (user_id, account_number, balance)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [userId, "CONC100001", "250.00"]
        );

        accountId = account.rows[0].id;
    });

    test("should prevent two simultaneous withdrawals from double-spending", async () => {
        const request1 = withdrawMoney({
            accountId,
            userId,
            amount: "200",
            idempotencyKey: "CONCURRENCY-AUTO-001"
        });

        const request2 = withdrawMoney({
            accountId,
            userId,
            amount: "200",
            idempotencyKey: "CONCURRENCY-AUTO-002"
        });

        const results = await Promise.allSettled([
            request1,
            request2
        ]);

        const successful = results.filter(
            result => result.status === "fulfilled"
        );

        const failed = results.filter(
            result => result.status === "rejected"
        );

        expect(successful).toHaveLength(1);
        expect(failed).toHaveLength(1);

        expect(failed[0].reason.message).toBe("Insufficient balance");

        // Verify the actual account balance.
        const balanceResult = await pool.query(
            "SELECT balance FROM accounts WHERE id = $1",
            [accountId]
        );

        expect(String(balanceResult.rows[0].balance)).toBe("50.00");

        // Only one withdrawal transaction should exist.
        const transactionResult = await pool.query(
            `SELECT COUNT(*) AS count
             FROM transactions
             WHERE initiated_by = $1
             AND type = 'WITHDRAWAL'`,
            [userId]
        );

        expect(Number(transactionResult.rows[0].count)).toBe(1);

        // Exactly one debit ledger entry should exist.
        const ledgerResult = await pool.query(
            `SELECT COUNT(*) AS count
             FROM ledger_entries
             WHERE account_id = $1
             AND entry_type = 'DEBIT'`,
            [accountId]
        );

        expect(Number(ledgerResult.rows[0].count)).toBe(1);
    });
});

afterAll(async () => {
    await pool.end();
});
