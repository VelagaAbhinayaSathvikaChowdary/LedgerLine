import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [activeAction, setActiveAction] = useState(null);
const [amount, setAmount] = useState("");
const [toAccountId, setToAccountId] = useState("");
const [depositAccountId, setDepositAccountId] = useState("");
const [transactionLoading, setTransactionLoading] = useState(false);
const [transactionError, setTransactionError] = useState("");
const [transactionSuccess, setTransactionSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountError, setAccountError] = useState("");

  const fetchAccounts = async (token) => {
    try {
      const response = await axios.get(
        `${API}/api/accounts/my-accounts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Accounts API response:", response.data);
      setAccounts(response.data.accounts);
      setAccountError("");
    } catch (err) {
      console.error("Accounts API error:", err.response?.data || err.message);
      setAccountError(
        err.response?.data?.message || "Could not load account details."
      );
    }
  };
  useEffect(() => {
  const token = localStorage.getItem("token");

  if (user && token) {
    fetchAccounts(token);
  }
}, [user]);
const handleTransaction = async (e) => {
  e.preventDefault();

  setTransactionLoading(true);
  setTransactionError("");
  setTransactionSuccess("");

  
const token = localStorage.getItem("token");
const idempotencyKey = crypto.randomUUID();

if (
  activeAction !== "deposit" &&
  !accounts[0]?.id
) {
  setTransactionError("Account details are not available.");
  setTransactionLoading(false);
  return;
}

if (activeAction === "deposit" && !depositAccountId) {
  setTransactionError("Enter the recipient account ID.");
  setTransactionLoading(false);
  return;
}
let endpoint = "";
let payload = {};

if (activeAction === "withdraw") {
  endpoint = "/api/transactions/withdraw";
  payload = {
    accountId: accounts[0].id,
    amount,
    idempotencyKey,
  };
}

if (activeAction === "deposit") {
  endpoint = "/api/transactions/deposit";
  payload = {
    accountId: Number(depositAccountId),
    amount,
    idempotencyKey,
  };
}

if (activeAction === "transfer") {
  endpoint = "/api/transactions/transfer";
  payload = {
    fromAccountId: accounts[0].id,
    toAccountId: Number(toAccountId),
    amount,
    idempotencyKey,
  };
}

  try {
    const response = await axios.post(`${API}${endpoint}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setTransactionSuccess(
      response.data.message || "Transaction completed successfully!"
    );

    setAmount("");
    setToAccountId("");

    await fetchAccounts(token);
  } catch (err) {
    setTransactionError(
      err.response?.data?.message || "Transaction failed. Please try again."
    );
  } finally {
    setTransactionLoading(false);
  }
};
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      const { token, user: loggedInUser } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      setUser(loggedInUser);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setAccounts([]);
    setEmail("");
    setPassword("");
  };

  // Restore account data when the page is refreshed.
  // The token is checked whenever the app initially loads.
  if (!user && localStorage.getItem("token")) {
    // A user without a saved profile must sign in again.
    localStorage.removeItem("token");
  }

  if (user) {
    const account = accounts[0];

    return (
      <div className="dashboard">
        <header className="dash-header">
          <div className="brand">
            <div className="brand-icon">L</div>
            <span>LedgerLine</span>
          </div>

          <div className="header-user">
            <span>{user.name}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="dash-main">
          <div className="dash-heading">
            <div>
              <p className="form-label">OVERVIEW</p>
              <h1>Welcome back, {user.name}!</h1>
              <p>Here's what's happening with your account.</p>
            </div>
            <span className="role-badge">{user.role}</span>
          </div>

          {accountError && <p className="form-error">{accountError}</p>}

          {user.role === "ADMIN" ? (
  <section className="action-grid">
    <button
      className="action-card"
      onClick={() => {
        setActiveAction("deposit");
        setTransactionError("");
        setTransactionSuccess("");
      }}
    >
      <div className="action-icon">↓</div>
      <h3>Deposit Funds</h3>
      <p>Add money to a holder's account.</p>
    </button>
  </section>
) : account ? (
  <>
    <section className="balance-card">
      <p>YOUR ACCOUNT BALANCE</p>
      <h2>
        ₹
        {Number(account.balance).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </h2>
      <div className="account-info">
        <span>Account Number</span>
        <strong>{account.account_number}</strong>
      </div>
      <div className="account-status">
        <span>●</span> {account.status}
      </div>
    </section>

    <h2 className="section-heading">Money movement</h2>

    <div className="action-grid">
      <button
        className="action-card"
        onClick={() => {
          setActiveAction("withdraw");
          setTransactionError("");
          setTransactionSuccess("");
        }}
      >
        <div className="action-icon">↑</div>
        <h3>Withdraw</h3>
        <p>Withdraw money securely.</p>
      </button>

      <button
        className="action-card"
        onClick={() => {
          setActiveAction("transfer");
          setTransactionError("");
          setTransactionSuccess("");
        }}
      >
        <div className="action-icon">⇄</div>
        <h3>Transfer</h3>
        <p>Move money between accounts.</p>
      </button>
    </div>
  </>
) : (
  !accountError && (
    <p className="empty-message">Loading your account...</p>
  )
)}
          {activeAction && (
  <div className="modal-overlay">
    <form className="transaction-modal" onSubmit={handleTransaction}>
      <button
        type="button"
        className="modal-close"
        onClick={() => setActiveAction(null)}
      >
        ×
      </button>

      <p className="form-label">LEDGERLINE TRANSACTION</p>

      <h2>
        {activeAction === "withdraw" && "Withdraw Money"}
        {activeAction === "deposit" && "Deposit Money"}
        {activeAction === "transfer" && "Transfer Money"}
      </h2>

      <p className="subtitle">
        {activeAction === "transfer"
          ? "Enter the destination account ID and amount."
          : "Enter the amount for this transaction."}
      </p>

      {activeAction === "transfer" && (
        <>
          <label>Recipient Account ID</label>
          <input
            type="number"
            min="1"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            placeholder="Enter recipient account ID"
            required
          />
        </>
      )}
{activeAction === "deposit" && (
  <>
    <label>Recipient Account ID</label>
    <input
      type="number"
      min="1"
      value={depositAccountId}
      onChange={(e) => setDepositAccountId(e.target.value)}
      placeholder="Enter holder account ID"
      required
    />
  </>
)}
      <label>Amount (₹)</label>
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        required
      />

      {transactionError && (
        <p className="form-error">{transactionError}</p>
      )}

      {transactionSuccess && (
        <p className="form-success">{transactionSuccess}</p>
      )}

      <button type="submit" disabled={transactionLoading}>
        {transactionLoading ? "Processing..." : "Confirm Transaction"}
      </button>

      <button
        type="button"
        className="cancel-btn"
        onClick={() => setActiveAction(null)}
      >
        Cancel
      </button>
    </form>
  </div>
)}
          <div className="trust-card">
            <span>🔒</span>
            <div>
              <strong>Your money. Your records. Your control.</strong>
              <p>Every successful movement is recorded in the LedgerLine ledger.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="brand-icon">L</div>
          <span>LedgerLine</span>
        </div>

        <div className="welcome">
          <p className="eyebrow">FINANCIAL TRANSPARENCY</p>
          <h1>Every transaction.<br />Accounted for.</h1>
          <p className="welcome-text">
            Move money with confidence. Every transaction is recorded,
            verified, and backed by an immutable ledger.
          </p>

          <div className="feature">
            <span>✓</span>
            <div>
              <strong>Secure transactions</strong>
              <p>Protected with authentication and access control.</p>
            </div>
          </div>

          <div className="feature">
            <span>✓</span>
            <div>
              <strong>Transparent records</strong>
              <p>Every movement leaves a verifiable trail.</p>
            </div>
          </div>
        </div>

        <p className="left-footer">LEDGERLINE © 2026</p>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="mobile-brand">LEDGERLINE</div>
          <p className="form-label">WELCOME BACK</p>
          <h2>Sign in to your account</h2>
          <p className="subtitle">
  {activeAction === "transfer"
    ? "Enter the destination account ID and amount."
    : activeAction === "deposit"
    ? "Enter the holder account ID and deposit amount."
    : "Enter the amount for this transaction."}
</p>

          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in →"}
          </button>

          <p className="security-note">
            🔒 Your financial data is protected.
          </p>
        </form>
      </div>
    </div>
  );
}

export default App;
