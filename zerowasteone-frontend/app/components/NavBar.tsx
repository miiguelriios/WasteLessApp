"use client"; // 👈 this tells Next.js it’s a Client Component

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("zwo_token");
    const storedUser = localStorage.getItem("zwo_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("zwo_token");
    localStorage.removeItem("zwo_user");
    window.location.href = "/login";
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-semibold text-gray-800 hover:text-black">
          ZeroWasteOne
        </Link>
        <Link href="/dashboard" className="text-gray-600 hover:text-black">
          Dashboard
        </Link>
        <Link href="/" className="text-gray-600 hover:text-black">
          Inventory
        </Link>
        <Link href="/alerts" className="text-gray-600 hover:text-black">
          Alerts
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              {user.email} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm rounded border px-3 py-1 hover:bg-gray-100"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm rounded border px-3 py-1 hover:bg-gray-100">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
