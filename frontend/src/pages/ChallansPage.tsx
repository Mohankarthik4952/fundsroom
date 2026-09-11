import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ChallansPage() {
  const { token } = useAuth();
  const [challans, setChallans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    status: "DRAFT",
    items: [{ productId: "", quantity: 1 }],
  });
  const [error, setError] = useState("");

  async function loadData() {
    const [customersRes, productsRes, challansRes] = await Promise.all([
      fetch(`${API_URL}/customers?page=1&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/products?page=1&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/challans?page=1&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const customerData = await customersRes.json();
    const productData = await productsRes.json();
    const challanData = await challansRes.json();

    setCustomers(customerData.data || []);
    setProducts(productData.data || []);
    setChallans(challanData.data || []);
  }

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  function handleProductChange(index: number, value: string) {
    const next = [...form.items];
    next[index] = { ...next[index], productId: value };
    setForm({ ...form, items: next });
  }

  function handleQuantityChange(index: number, value: number) {
    const next = [...form.items];
    next[index] = { ...next[index], quantity: value };
    setForm({ ...form, items: next });
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { productId: "", quantity: 1 }],
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch(`${API_URL}/challans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerId: form.customerId,
        status: form.status,
        items: form.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Unable to create challan");
      return;
    }

    setForm({
      customerId: "",
      status: "DRAFT",
      items: [{ productId: "", quantity: 1 }],
    });
    loadData();
  }

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "1.2fr 1fr", alignItems: "start" }}
    >
      <div className="card">
        <h3>Sales challan</h3>
        {error ? <div className="notice error">{error}</div> : null}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>
          {form.items.map((item, index) => (
            <div
              key={index}
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "1.4fr 0.8fr",
                gap: 12,
              }}
            >
              <div className="field">
                <label>Product</label>
                <select
                  value={item.productId}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.currentStock} in stock)
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Qty</label>
                <input
                  type="number"
                  value={item.quantity}
                  min={1}
                  onChange={(e) =>
                    handleQuantityChange(index, Number(e.target.value))
                  }
                />
              </div>
            </div>
          ))}
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={addItem}
            >
              Add item
            </button>
            <button type="submit" className="primary-button">
              Save challan
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Recent challans</h3>
        {challans.map((challan) => (
          <div
            key={challan.id}
            style={{ borderBottom: "1px solid #dfe7f5", padding: "12px 0" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong>{challan.challanNumber}</strong>
              <span className={`badge ${String(challan.status).toLowerCase()}`}>
                {challan.status}
              </span>
            </div>
            <p style={{ margin: "8px 0 0", color: "#5b6f86" }}>
              {challan.customer?.name}
            </p>
            <small>
              {challan.items.length} items · Qty {challan.totalQuantity}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
