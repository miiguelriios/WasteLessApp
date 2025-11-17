"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@zerowasteone.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
      const data = await res.json();
      // save token
      localStorage.setItem("zwo_token", data.token);
      localStorage.setItem("zwo_user", JSON.stringify(data.user));
      router.push("/"); // go to inventory
    } catch (e:any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-3xl font-bold">Sign in</h1>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-2 text-red-700">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="flex flex-col text-sm">
          Email
          <input className="mt-1 rounded border p-2" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="flex flex-col text-sm">
          Password
          <input type="password" className="mt-1 rounded border p-2" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button disabled={loading} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-3 text-xs text-gray-500">
        Tip: use the seeded admin: <code>admin@zerowasteone.local / admin123</code> (change later).
      </p>
    </div>
  );
}
