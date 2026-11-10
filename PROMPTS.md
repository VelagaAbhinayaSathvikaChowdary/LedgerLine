# LedgerLine — AI Development Prompt Log

This document records AI-assisted development during the LedgerLine hackathon, including prompts, generated suggestions, limitations identified, and changes made during implementation.

## Entry 1 — November 8, 2026

**Topic:** PostgreSQL database setup and financial schema

**Prompt asked:**

Help design a PostgreSQL database schema for a financial transaction system containing users, accounts, transactions, ledger entries and audit logs. Include appropriate constraints and relationships.

**AI output:**

Suggested five relational tables with primary keys, foreign keys, unique constraints, role validation and balance validation.

**What was wrong or incomplete:**

The initial schema did not fully address append-only ledger protection or all transaction account relationships.

**What I changed:**

- Added transaction account relationship constraints.
- Added a PostgreSQL trigger to prevent ledger UPDATE and DELETE operations.
- Verified the tables and constraints using pgAdmin.

**Commit reference:** Database schema work — documentation commit pending.

---

## Entry 2 — November 8, 2026

**Topic:** Authentication and access control

**Prompt asked:**

Implement JWT authentication in an Express application using bcrypt password verification. Explain how to protect financial APIs and identify users securely.

**AI output:**

Suggested login functionality, JWT generation, token verification middleware and role-based authorization.

**What was wrong or incomplete:**

Authentication alone does not guarantee account ownership. A user could attempt to access another user's account by changing an account ID.

**What I changed:**

- Added JWT authentication middleware.
- Used the authenticated user's ID from the verified token.
- Added account ownership validation.
- Tested unauthorized account access using Postman.

**Commit reference:** `feat: implement secure money movement APIs` — local commit; GitHub commit link to be added.

---

## Entry 3 — November 9, 2026

**Topic:** Financial transaction integrity

**Prompt asked:**

Implement secure deposit, withdrawal and account-to-account transfer operations using Node.js, Express and PostgreSQL. Ensure that all related financial changes succeed or fail together.

**AI output:**

Suggested PostgreSQL transactions using BEGIN, COMMIT and ROLLBACK, along with row-level locking using SELECT FOR UPDATE.

**What was wrong or incomplete:**

The initial implementation required additional validation and concurrency testing. A successful API response alone was insufficient to prove financial consistency.

**What I changed:**

- Implemented withdrawal and deposit services.
- Implemented transfers with DEBIT and CREDIT ledger entries.
- Added database row locking.
- Tested money movement through Postman.
- Verified corresponding ledger records in PostgreSQL.

**Commit reference:** `feat: implement secure money movement APIs` — local commit; GitHub commit link to be added.

---

## Entry 4 — November 9, 2026

**Topic:** Idempotency and duplicate transaction protection

**Prompt asked:**

How can a financial application prevent duplicate transfers when the same request is submitted more than once?

**AI output:**

Suggested using idempotency keys and a database uniqueness constraint on the requesting user and idempotency key.

**What was wrong or incomplete:**

The initial implementation rejected duplicate requests but did not return the original transaction result. Concurrent duplicate-request handling also needed further hardening.

**What I changed:**

- Added a unique constraint on `(initiated_by, idempotency_key)`.
- Added duplicate request detection.
- Tested submitting the same transfer request twice.
- Verified that the account balances did not change on the duplicate attempt.

**Commit reference:** `feat: implement secure money movement APIs` — local commit; GitHub commit link to be added.

---

## Entry 5 — November 10, 2026

**Topic:** Concurrent withdrawals and double-spending prevention

**Prompt asked:**

How can PostgreSQL prevent two simultaneous withdrawal requests from spending the same account balance? Suggest a way to test this concurrency scenario.

**AI output:**

Suggested SELECT FOR UPDATE to lock account rows and a Node.js test using Promise.allSettled to execute simultaneous withdrawal requests.

**What was wrong or incomplete:**

The initial manual testing approach could not reliably demonstrate simultaneous requests.

**What I changed:**

- Created `test-concurrency.js`.
- Sent two simultaneous ₹800 withdrawal requests against an account containing ₹1,200.
- Used different idempotency keys to isolate concurrency testing.
- Verified that only one request succeeded and the other failed due to insufficient balance.
- Confirmed the final balance was ₹400.

**Commit reference:** `feat: implement secure money movement APIs` — local commit; GitHub commit link to be added.

---

## Future AI-assisted development entries

Additional entries will be added as development continues, particularly for:

- Automated security testing.
- Audit logging.
- Deployment configuration.
- Financial integrity verification.

All AI-generated suggestions are reviewed, tested and modified before being included in the project.
