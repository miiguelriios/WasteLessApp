export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("zwo_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) =>
    fetch(`${API_URL}${path}`, { cache: "no-store", headers: { ...authHeaders() } }).then(handle<T>),
  post: <T>(path: string, body: unknown) =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle<T>),
  put:  <T>(path: string, body: unknown) =>
    fetch(`${API_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle<T>),
  del:  (path: string) =>
    fetch(`${API_URL}${path}`, { method: "DELETE", headers: { ...authHeaders() } }).then(async r => {
      if (!r.ok && r.status !== 204) throw new Error(await r.text().catch(()=>r.statusText));
    }),
};
