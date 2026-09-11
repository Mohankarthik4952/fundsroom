import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [note, setNote] = useState("");

  async function loadCustomer() {
    const response = await fetch(`${API_URL}/customers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      setCustomer(data);
    }
  }

  useEffect(() => {
    if (token && id) loadCustomer();
  }, [token, id]);

  async function addFollowUp() {
    const response = await fetch(`${API_URL}/customers/${id}/follow-ups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note }),
    });
    if (response.ok) {
      setNote("");
      loadCustomer();
    }
  }

  if (!customer) return <div className="card">Loading...</div>;

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}
    >
      <div className="card">
        <h3>{customer.name}</h3>
        <p>
          <strong>Mobile:</strong> {customer.mobile}
        </p>
        <p>
          <strong>Email:</strong> {customer.email || "-"}
        </p>
        <p>
          <strong>Business:</strong> {customer.businessName || "-"}
        </p>
        <p>
          <strong>GST:</strong> {customer.gstNumber || "-"}
        </p>
        <p>
          <strong>Type:</strong> {customer.customerType}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className={`badge ${String(customer.status).toLowerCase()}`}>
            {customer.status}
          </span>
        </p>
        <p>
          <strong>Address:</strong> {customer.address || "-"}
        </p>
        <p>
          <strong>Notes:</strong> {customer.notes || "-"}
        </p>
      </div>

      <div className="card">
        <h3>Follow-ups</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add follow-up details"
        />
        <button
          className="primary-button"
          style={{ marginTop: 10 }}
          onClick={addFollowUp}
        >
          Save note
        </button>
        <div style={{ marginTop: 16 }}>
          {customer.followUps?.map((entry: any) => (
            <div
              key={entry.id}
              style={{
                borderTop: "1px solid #dfe7f5",
                paddingTop: 12,
                marginTop: 12,
              }}
            >
              <p style={{ margin: 0 }}>{entry.note}</p>
              <small style={{ color: "#5b6f86" }}>
                {new Date(entry.createdAt).toLocaleString()} ·{" "}
                {entry.createdBy?.name}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
