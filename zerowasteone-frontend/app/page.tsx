"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Item, Category, Supplier } from "@/lib/types";

function daysUntil(dateStr?: string | null) {
  if (!dateStr) return Infinity;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.ceil((+d - +today) / 86400000);
}

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [sups, setSups] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  // create/edit form
  const [form, setForm] = useState({
    name: "", quantity: 0, unit: "pcs", expiry_date: "",
    category_id: "", supplier_id: "", reorder_level: "",
  });
  const [editingId, setEditingId] = useState<number|null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    try {
      setError(null);
      setLoading(true);
      const [itemsRes, catsRes, supsRes] = await Promise.all([
        api.get<Item[]>("/items"),
        api.get<Category[]>("/categories"),
        api.get<Supplier[]>("/suppliers"),
      ]);
      setItems(itemsRes); setCats(catsRes); setSups(supsRes);
    } catch (e:any) {
      setError(e.message || "Failed to load data");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit || null,
        expiry_date: form.expiry_date || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        reorder_level: form.reorder_level ? Number(form.reorder_level) : null,
      };
      if (editingId) {
        await api.put<Item>(`/items/${editingId}`, payload);
      } else {
        await api.post<Item>("/items", payload);
      }
      resetForm();
      await loadAll();
    } catch (e:any) { setError(e.message || "Save failed"); }
    finally { setSubmitting(false); }
  }

  function resetForm() {
    setForm({ name:"", quantity:0, unit:"pcs", expiry_date:"", category_id:"", supplier_id:"", reorder_level:"" });
    setEditingId(null);
  }

  function startEdit(it: Item) {
    setEditingId(it.item_id);
    setForm({
      name: it.name,
      quantity: it.quantity,
      unit: it.unit ?? "pcs",
      expiry_date: it.expiry_date ?? "",
      category_id: it.category_id?.toString() ?? "",
      supplier_id: it.supplier_id?.toString() ?? "",
      reorder_level: it.reorder_level?.toString() ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    try {
      await api.del(`/items/${id}`);
      await loadAll();
    } catch (e:any) {
      setError(e.message || "Delete failed");
    }
  }

  const expSoonIds = useMemo(() => {
    return new Set(items.filter(i => daysUntil(i.expiry_date) <= 3).map(i => i.item_id));
  }, [items]);

  return (
    <main className="min-h-dvh bg-gray-50">
      <div className="mx-auto max-w-6xl p-6 space-y-8">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">ZeroWasteOne – Inventory</h1>
            <p className="text-sm text-gray-600">Track stock, expiry, and suppliers.</p>
          </div>
          <button onClick={loadAll} className="rounded-lg border px-4 py-2 text-sm hover:bg-white shadow">
            Refresh
          </button>
        </header>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

        {/* Add / Edit Form */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="mb-4 text-xl font-semibold">{editingId ? "Edit Item" : "Add Item"}</h2>
            {editingId && (
              <button onClick={resetForm} className="text-sm underline">Cancel edit</button>
            )}
          </div>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">
              Name
              <input className="mt-1 rounded border p-2" value={form.name}
                     onChange={(e)=>setForm({...form, name: e.target.value})} required />
            </label>
            <label className="flex flex-col text-sm">
              Quantity
              <input type="number" min={0} className="mt-1 rounded border p-2" value={form.quantity}
                     onChange={(e)=>setForm({...form, quantity: Number(e.target.value)})} required />
            </label>
            <label className="flex flex-col text-sm">
              Unit
              <input className="mt-1 rounded border p-2" value={form.unit}
                     onChange={(e)=>setForm({...form, unit: e.target.value})} placeholder="kg, L, pcs" />
            </label>
            <label className="flex flex-col text-sm">
              Expiry Date
              <input type="date" className="mt-1 rounded border p-2" value={form.expiry_date}
                     onChange={(e)=>setForm({...form, expiry_date: e.target.value})} />
            </label>
            <label className="flex flex-col text-sm">
              Category
              <select className="mt-1 rounded border p-2" value={form.category_id}
                      onChange={(e)=>setForm({...form, category_id: e.target.value})}>
                <option value="">— none —</option>
                {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-sm">
              Supplier
              <select className="mt-1 rounded border p-2" value={form.supplier_id}
                      onChange={(e)=>setForm({...form, supplier_id: e.target.value})}>
                <option value="">— none —</option>
                {sups.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-sm">
              Reorder Level
              <input type="number" className="mt-1 rounded border p-2" value={form.reorder_level}
                     onChange={(e)=>setForm({...form, reorder_level: e.target.value})} placeholder="e.g. 5" />
            </label>
            <div className="col-span-2">
              <button disabled={submitting}
                      className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
                {submitting ? (editingId ? "Saving..." : "Adding...") : (editingId ? "Save Changes" : "Add Item")}
              </button>
            </div>
          </form>
        </section>

        {/* Items Table */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Current Items</h2>
          {loading ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-600">No items yet. Add your first above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="p-2">ID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Expiry</th>
                    <th className="p-2">Days</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const days = daysUntil(it.expiry_date);
                    const expSoon = days <= 3;
                    return (
                      <tr key={it.item_id} className={`border-b ${expSoon ? "bg-yellow-50" : ""}`}>
                        <td className="p-2">{it.item_id}</td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">{it.quantity}</td>
                        <td className="p-2">{it.unit ?? "-"}</td>
                        <td className="p-2">{it.expiry_date ?? "-"}</td>
                        <td className={`p-2 ${expSoon ? "font-semibold text-yellow-700" : "text-gray-600"}`}>
                          {Number.isFinite(days) ? days : "—"}
                        </td>
                        <td className="p-2 space-x-2">
                          <button onClick={() => startEdit(it)} className="rounded border px-2 py-1 hover:bg-white">
                            Edit
                          </button>
                          <button onClick={() => onDelete(it.item_id)} className="rounded border px-2 py-1 hover:bg-white">
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">Rows highlighted indicate expiry within 3 days.</p>
        </section>
      </div>
    </main>
  );
}
