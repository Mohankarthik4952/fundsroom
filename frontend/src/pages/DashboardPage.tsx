import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function fetchSummary() {
      const response = await fetch(`${API_URL}/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    }
    if (token) fetchSummary();
  }, [token]);

  const metrics = [
    { label: "Customers", value: summary?.customerCount ?? 0 },
    { label: "Products", value: summary?.productCount ?? 0 },
    { label: "Draft challans", value: summary?.pendingChallans ?? 0 },
    { label: "Total revenue", value: `₹${summary?.totalRevenue ?? 0}` },
  ];

  return (
    <div>
      <div className="grid grid-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="card metric">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
