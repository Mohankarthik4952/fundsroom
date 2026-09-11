import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unitPrice: "0",
    currentStock: "0",
    minStockAlert: "0",
    location: "",
  });
  const [showCreate, setShowCreate] = useState(false);

  async function loadProducts() {
    const response = await fetch(
      `${API_URL}/products?q=${encodeURIComponent(query)}&page=1&pageSize=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await response.json();
    setProducts(data.data || []);
  }

  useEffect(() => {
    if (token) loadProducts();
  }, [token, query]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        sku: form.sku,
        category: form.category,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        minStockAlert: Number(form.minStockAlert),
        location: form.location,
      }),
    });
    if (response.ok) {
      setShowCreate(false);
      setForm({
        name: "",
        sku: "",
        category: "",
        unitPrice: "0",
        currentStock: "0",
        minStockAlert: "0",
        location: "",
      });
      loadProducts();
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3>Products & Inventory</h3>
        <button
          className="primary-button"
          onClick={() => setShowCreate((v) => !v)}
        >
          Add product
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
        />
      </div>

      {showCreate ? (
        <div className="modal" onClick={() => setShowCreate(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create product</h3>
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
                <label>SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Category</label>
                <input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Unit price</label>
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Current stock</label>
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm({ ...form, currentStock: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Min stock alert</label>
                <input
                  type="number"
                  value={form.minStockAlert}
                  onChange={(e) =>
                    setForm({ ...form, minStockAlert: e.target.value })
                  }
                />
              </div>
              <div className="field full">
                <label>Location</label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
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
                  Save product
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
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td>₹{product.unitPrice}</td>
                <td>{product.currentStock}</td>
                <td>{product.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
