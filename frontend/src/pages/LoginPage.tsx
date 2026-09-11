import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@mini.erp");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Login failed");
      return;
    }

    login(data);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#edf3ff",
      }}
    >
      <div className="card" style={{ width: "min(440px, calc(100vw - 32px))" }}>
        <div style={{ marginBottom: 18 }}>
          <p className="eyebrow">Mini ERP + CRM</p>
          <h2 style={{ margin: "6px 0 0" }}>Operations Portal</h2>
        </div>

        {error ? <div className="notice error">{error}</div> : null}

        <form
          onSubmit={handleSubmit}
          className="form-grid"
          style={{ gridTemplateColumns: "1fr" }}
        >
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-button">
            Login
          </button>
        </form>

        <div style={{ marginTop: 20, color: "#5b6f86", fontSize: "0.82rem" }}>
          Demo accounts: admin@mini.erp / admin123, sales@mini.erp / sales123,
          warehouse@mini.erp / warehouse123, accounts@mini.erp / accounts123
        </div>
      </div>
    </div>
  );
}
