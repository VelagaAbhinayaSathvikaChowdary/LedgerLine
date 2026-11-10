
require("dotenv").config();

const { withdrawMoney } = require("./src/services/transactionService");
const pool = require("./src/config/db");

async function testConcurrentWithdrawals() {
    console.log("Starting concurrent withdrawal test...\n");

    const request1 = withdrawMoney({
        accountId: 2,
        userId: 2,
        amount: 800,
        idempotencyKey: "CONCURRENT-WITHDRAW-001"
    });

    const request2 = withdrawMoney({
        accountId: 2,
        userId: 2,
        amount: 800,
        idempotencyKey: "CONCURRENT-WITHDRAW-002"
    });

    const results = await Promise.allSettled([
        request1,
        request2
    ]);

    results.forEach((result, index) => {
        console.log(`Request ${index + 1}:`);

        if (result.status === "fulfilled") {
            console.log("SUCCESS:", result.value);
        } else {
            console.log("FAILED:", result.reason.message);
        }

        console.log("------------------------");
    });

    await pool.end();
}

testConcurrentWithdrawals().catch(async error => {
    console.error("Test error:", error);
    await pool.end();
    process.exitCode = 1;
});
