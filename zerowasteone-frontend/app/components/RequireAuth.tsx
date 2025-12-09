"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // run only in browser
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("zwo_token");

    if (!token) {
      // no token → send to login
      router.replace("/login");
    } else {
      // token exists → allow render
      setChecked(true);
    }
  }, [router]);

  // While checking, render nothing to avoid flicker
  if (!checked) return null;

  return <>{children}</>;
}
