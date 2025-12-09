"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type StatResponse = {
  total_items: string | number;
  expiring_soon: string | number;
  low_stock: string | number;
  nextToExpire: { item_id:number; name:string; quantity:number; unit:string|null; expiry_date:string|null }[];
  byCategory: { category:string; count:string }[];
  lowStockList: { item_id:number; name:string; quantity:number; unit:string|null; reorder_level:number|null }[];
};


export default function DashboardPage() {
  const [stats, setStats] = useState<StatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const EXPIRY_WINDOW_DAYS = 3;

  function daysUntil(dateStr: string | null | undefined) {
    if (!dateStr) return Infinity;
    const today = new Date();
    const d = new Date(dateStr);
    const diffMs = d.getTime() - today.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  const nextToExpireItems =
    stats?.nextToExpire
      ?.filter((it) => daysUntil(it.expiry_date) <= EXPIRY_WINDOW_DAYS)
      .sort(
        (a, b) =>
          new Date(a.expiry_date!).getTime() -
          new Date(b.expiry_date!).getTime()
      ) ?? [];


  async function load() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API_URL}/items/stats`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as StatResponse;
      // coerce numeric strings from Postgres into numbers (if needed)
      setStats({
        ...data,
        total_items: Number(data.total_items),
        expiring_soon: Number(data.expiring_soon),
        low_stock: Number(data.low_stock),
        byCategory: data.byCategory.map((r) => ({ category: r.category, count: String(r.count) })),
      });
    } catch (e: any) {
      setError(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button onClick={load} className="rounded-lg border px-4 py-2 text-sm hover:bg-white shadow">Refresh</button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {loading && <p className="text-sm text-gray-600">Loading…</p>}

      {/* KPI Cards */}
      {stats && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard title="Total Items" value={stats.total_items} />
          <KpiCard title="Expiring Soon (≤ 3 days)" value={stats.expiring_soon} emphasis />
          <KpiCard title="Low Stock" value={stats.low_stock} emphasis />
        </section>
      )}

      {/* Next to Expire */}
        {stats && (
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Next to Expire</h2>
            {nextToExpireItems.length === 0 ? (
              <p className="text-sm text-gray-600">No items with upcoming expiry.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600">
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextToExpireItems.map((it) => (
                      <tr key={it.item_id} className="border-b">
                        <td className="p-2">{it.item_id}</td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">{it.quantity}</td>
                        <td className="p-2">{it.unit ?? "-"}</td>
                        <td className="p-2">
                          {it.expiry_date
                            ? new Date(it.expiry_date).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

      {/* Low Stock */}
        {stats && (
        <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Low Stock</h2>
            {stats.lowStockList.length === 0 ? (
            <p className="text-sm text-gray-600">No items at or below reorder level.</p>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="p-2">ID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Reorder Level</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.lowStockList.map((it) => (
                    <tr key={it.item_id} className="border-b">
                        <td className="p-2">{it.item_id}</td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">{it.quantity}</td>
                        <td className="p-2">{it.unit ?? "-"}</td>
                        <td className="p-2">{it.reorder_level ?? "-"}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
            Items listed here are at or below their reorder level.
            </p>
        </section>
        )}


      {/* Breakdown by Category */}
      {stats && (
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Items by Category</h2>
          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-gray-600">No data yet.</p>
          ) : (
            <ul className="space-y-1">
              {stats.byCategory.map((r) => (
                <li key={r.category} className="flex justify-between border-b py-2">
                  <span>{r.category}</span>
                  <span className="text-gray-700">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function KpiCard({ title, value, emphasis }: { title: string; value: number | string; emphasis?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow ${emphasis ? "ring-1 ring-yellow-200" : ""}`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}
