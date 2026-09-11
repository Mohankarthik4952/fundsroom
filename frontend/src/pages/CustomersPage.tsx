import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function CustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    businessName: "",
    gstNumber: "",
    customerType: "RETAIL",
    address: "",
    status: "LEAD",
    followUpDate: "",
    notes: "",
  });
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  async function loadCustomers() {
    const response = await fetch(
      `${API_URL}/customers?q=${encodeURIComponent(search)}&page=1&pageSize=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await response.json();
    setCustomers(data.data || []);
  }

  useEffect(() => {
    if (token) loadCustomers();
  }, [token, search]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch(`${API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Unable to create customer");
      return;
    }

    setShowCreate(false);
    setForm({
      name: "",
      mobile: "",
      email: "",
      businessName: "",
      gstNumber: "",
      customerType: "RETAIL",
      address: "",
      status: "LEAD",
      followUpDate: "",
      notes: "",
    });
    loadCustomers();
  }

  return (
    <div>
      <div className="page-header">
        <h3>Customer CRM</h3>
        <button
          className="primary-button"
          onClick={() => setShowCreate((v) => !v)}
        >
          Add customer
        </button>
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers"
          />
        </div>
      </div>

      {showCreate ? (
        <div className="modal" onClick={() => setShowCreate(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add customer</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Mobile</label>
                <input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Business name</label>
                <input
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>GST number</label>
                <input
                  value={form.gstNumber}
                  onChange={(e) =>
                    setForm({ ...form, gstNumber: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Customer type</label>
                <select
                  value={form.customerType}
                  onChange={(e) =>
                    setForm({ ...form, customerType: e.target.value })
                  }
                >
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
              </div>
              <div className="field full">
                <label>Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="field">
                <label>Follow-up date</label>
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) =>
                    setForm({ ...form, followUpDate: e.target.value })
                  }
                />
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div
                className="row"
                style={{ gridColumn: "1 / -1", justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save customer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Business</th>
              <th>Type</th>
              <th>Status</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
                </td>
                <td>{customer.mobile}</td>
                <td>{customer.businessName || "-"}</td>
                <td>{customer.customerType}</td>
                <td>
                  <span
                    className={`badge ${String(customer.status).toLowerCase()}`}
                  >
                    {customer.status}
                  </span>
                </td>
                <td>
                  {customer.followUpDate
                    ? new Date(customer.followUpDate).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
