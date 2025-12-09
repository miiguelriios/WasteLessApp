"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Alert = {
  alert_id: number;
  item_id: number | null;
  item_name: string | null;
  alert_type: string;
  message: string;
  created_at: string;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAlerts() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API_URL}/alerts`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      const data = (await res.json()) as Alert[];
      setAlerts(data);
    } catch (e: any) {
      setError(e.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  async function runAlertsNow() {
    try {
      setError(null);
      setRunning(true);
      const res = await fetch(`${API_URL}/alerts/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      // re-load alerts after job
      await loadAlerts();
    } catch (e: any) {
      setError(e.message || "Failed to run alert job");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Alerts</h1>
        <div className="flex gap-2">
          <button
            onClick={loadAlerts}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-white shadow"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={runAlertsNow}
            className="rounded-lg border border-yellow-400 bg-yellow-100 px-4 py-2 text-sm hover:bg-yellow-50 shadow disabled:opacity-60"
            disabled={running}
          >
            {running ? "Running alerts..." : "Run alerts now"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {alerts.length === 0 && !loading && !error && (
        <p className="text-sm text-gray-600">No alerts at the moment.</p>
      )}

      {alerts.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="p-2">ID</th>
                <th className="p-2">Item</th>
                <th className="p-2">Type</th>
                <th className="p-2">Message</th>
                <th className="p-2">Created at</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.alert_id} className="border-b">
                  <td className="p-2">{a.alert_id}</td>
                  <td className="p-2">{a.item_name ?? `#${a.item_id ?? "-"}`}</td>
                  <td className="p-2">
                    {a.alert_type === "expiring"
                      ? "Expiring soon"
                      : a.alert_type === "low_stock"
                      ? "Low stock"
                      : a.alert_type}
                  </td>
                  <td className="p-2">{a.message}</td>
                  <td className="p-2">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && <p className="text-sm text-gray-600">Loading alerts…</p>}
    </div>
  );
}
