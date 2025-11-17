import "./globals.css";
import NavBar from "./components/NavBar"; // 👈 import the new client component

export const metadata = {
  title: "ZeroWasteOne",
  description: "Sustainable inventory management system for hotels and restaurants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50">
        <NavBar /> {/* 👈 This is now a client component */}
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </body>
    </html>
  );
}
