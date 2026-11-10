# LedgerLine — Threat Model

## 1. Overview

LedgerLine is a financial transaction management system that supports deposits, withdrawals and account-to-account transfers.

Security and financial integrity are important because unauthorized access, duplicate requests or concurrent transactions could result in incorrect account balances.

## 2. Identified Threats and Mitigations

| Threat | Possible Impact | Mitigation |
|---|---|---|
| Unauthorized access | Users access protected APIs | JWT authentication |
| IDOR attacks | Users access another user's account | Verify account ownership on the backend |
| Double spending | Multiple withdrawals exceed available balance | PostgreSQL row-level locking using `SELECT FOR UPDATE` |
| Duplicate requests | Same transaction gets processed repeatedly | Idempotency keys and database unique constraints |
| SQL injection | Attackers manipulate database queries | Parameterized SQL queries |
| Password theft | Exposure of user credentials | bcrypt password hashing |
| Ledger tampering | Financial records are modified or deleted | Database trigger prevents ledger UPDATE and DELETE |
| Unauthorized deposits | Ordinary users create money | ADMIN-only deposit authorization |
| Concurrent transfers | Inconsistent sender and receiver balances | Database transactions and account row locking |
| Insufficient balance | Account balance becomes negative | Balance validation and database CHECK constraint |

## 3. Security Controls Implemented

### Authentication
- Passwords are hashed using bcrypt.
- JWT tokens are generated after successful login.
- Protected endpoints verify JWT tokens.

### Authorization
- Account ownership is checked before withdrawals and transfers.
- Deposits require the ADMIN role.

### Financial Integrity
- Money movements use PostgreSQL transactions.
- COMMIT saves all related changes together.
- ROLLBACK reverses changes when an operation fails.
- `SELECT FOR UPDATE` locks account rows during money movements.
- Transfers create corresponding DEBIT and CREDIT ledger entries.

### Ledger Protection
- A PostgreSQL trigger prevents UPDATE and DELETE operations on ledger entries.
- Ledger entries are associated with transaction records.

## 4. Security Testing Performed

| Test | Result |
|---|---|
| JWT login | Passed |
| Unauthorized account access | Passed |
| Successful withdrawal | Passed |
| Successful deposit | Passed |
| Successful transfer | Passed |
| Duplicate transfer request | Passed |
| Concurrent withdrawal test | Passed |
| Ledger UPDATE prevention | Passed during manual database testing |
| Ledger DELETE prevention | Passed during manual database testing |

## 5. Remaining Security Improvements

The following improvements are still required before production deployment:

- Return the original transaction result for repeated idempotency keys.
- Strengthen concurrent idempotency handling.
- Use exact decimal or integer-based money calculations.
- Add automated tests for financial integrity and authorization.
- Expand audit logging for sensitive operations.
- Strengthen ledger protection against TRUNCATE and privileged database access.
- Validate all API inputs consistently.
- Test security controls against the deployed application.

## 6. Conclusion

LedgerLine uses authentication, authorization, database transactions, row-level locking, idempotency constraints and append-only ledger protection to improve financial security.

Security testing and further hardening are ongoing.