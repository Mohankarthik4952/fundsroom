import { useEffect, useMemo, useState } from "react";

type StockMovement = {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: "IN" | "OUT";
  reason: string;
  timestamp: string;
  product?: {
    name: string;
    sku: string;
  };
  createdBy?: {
    name: string;
    email?: string;
    role?: string;
  };
};

type Product = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockAlert: number;
  location: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function InventoryPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState<"ALL" | "IN" | "OUT">(
    "ALL",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("mini-erp-token");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token],
  );

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");

      const [movementsResponse, productsResponse] = await Promise.all([
        fetch(`${API_URL}/stock-movements`, {
          headers,
        }),
        fetch(`${API_URL}/products`, {
          headers,
        }),
      ]);

      if (!movementsResponse.ok) {
        throw new Error("Failed to load stock movements");
      }

      if (!productsResponse.ok) {
        throw new Error("Failed to load products");
      }

      const movementsData = await movementsResponse.json();
      const productsData = await productsResponse.json();

      setMovements(
        Array.isArray(movementsData) ? movementsData : movementsData.data || [],
      );
      setProducts(
        Array.isArray(productsData) ? productsData : productsData.data || [],
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load inventory data",
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredMovements = movements.filter((movement) => {
    const productName = movement.product?.name || "";
    const sku = movement.product?.sku || "";

    const matchesSearch =
      productName.toLowerCase().includes(search.toLowerCase()) ||
      sku.toLowerCase().includes(search.toLowerCase()) ||
      movement.reason.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      movementFilter === "ALL" || movement.movementType === movementFilter;

    return matchesSearch && matchesType;
  });

  const lowStockProducts = products.filter(
    (product) => product.currentStock <= product.minStockAlert,
  );

  const totalStock = products.reduce(
    (sum, product) => sum + product.currentStock,
    0,
  );

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Inventory</h2>
            <p>Stock levels and movement history</p>
          </div>
        </div>

        <div className="card">
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Inventory</h2>
          <p>Monitor stock levels and stock movement history.</p>
        </div>

        <button className="btn btn-secondary" onClick={loadInventory}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid inventory-stats">
        <div className="stat-card">
          <span className="stat-label">Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Stock</span>
          <strong>{totalStock}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Low Stock</span>
          <strong>{lowStockProducts.length}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Movements</span>
          <strong>{movements.length}</strong>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h3>Current Stock</h3>
            <p>Current inventory levels by product.</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">No products available.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Minimum Alert</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const lowStock =
                    product.currentStock <= product.minStockAlert;

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>

                      <td>{product.sku}</td>
                      <td>{product.currentStock}</td>
                      <td>{product.minStockAlert}</td>
                      <td>{product.location}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            lowStock ? "status-warning" : "status-success"
                          }`}
                        >
                          {lowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h3>Stock Movement History</h3>
            <p>Track all inventory IN and OUT movements.</p>
          </div>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            placeholder="Search product, SKU or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={movementFilter}
            onChange={(e) =>
              setMovementFilter(e.target.value as "ALL" | "IN" | "OUT")
            }
          >
            <option value="ALL">All movements</option>
            <option value="IN">Stock IN</option>
            <option value="OUT">Stock OUT</option>
          </select>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="empty-state">No stock movements found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Movement</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Created By</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {filteredMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <strong>
                        {movement.product?.name || "Unknown product"}
                      </strong>
                    </td>

                    <td>{movement.product?.sku || "-"}</td>

                    <td>
                      <span
                        className={`movement-badge ${
                          movement.movementType === "IN"
                            ? "movement-in"
                            : "movement-out"
                        }`}
                      >
                        {movement.movementType}
                      </span>
                    </td>

                    <td>
                      {movement.movementType === "OUT"
                        ? `-${movement.quantityChanged}`
                        : `+${movement.quantityChanged}`}
                    </td>

                    <td>{movement.reason}</td>
                    <td>{movement.createdBy?.name || "-"}</td>
                    <td>
                      {movement.timestamp
                        ? new Date(movement.timestamp).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
