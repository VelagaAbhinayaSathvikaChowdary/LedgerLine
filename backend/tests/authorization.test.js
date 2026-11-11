
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

describe("LedgerLine Authorization Tests", () => {

    function generateToken(id, role) {
        return jwt.sign(
            { id, role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
    }

    test("should reject withdrawal without authentication", async () => {
        const response = await request(app)
            .post("/api/transactions/withdraw")
            .send({
                accountId: 2,
                amount: "100",
                idempotencyKey: "AUTH-TEST-001"
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Access token required");
    });

    test("should reject invalid JWT token", async () => {
        const response = await request(app)
            .post("/api/transactions/withdraw")
            .set("Authorization", "Bearer invalid-token")
            .send({
                accountId: 2,
                amount: "100",
                idempotencyKey: "AUTH-TEST-002"
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Invalid or expired token");
    });

    test("should reject HOLDER attempting to deposit", async () => {
        const holderToken = generateToken(2, "HOLDER");

        const response = await request(app)
            .post("/api/transactions/deposit")
            .set("Authorization", `Bearer ${holderToken}`)
            .send({
                accountId: 2,
                amount: "100",
                idempotencyKey: "AUTH-TEST-003"
            });

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
    });

    test("should reject AUDITOR attempting to deposit", async () => {
        const auditorToken = generateToken(4, "AUDITOR");

        const response = await request(app)
            .post("/api/transactions/deposit")
            .set("Authorization", `Bearer ${auditorToken}`)
            .send({
                accountId: 2,
                amount: "100",
                idempotencyKey: "AUTH-TEST-004"
            });

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
    });

});
